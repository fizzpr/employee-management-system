'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, RefreshCw, Check, AlertCircle, Loader2, X, Navigation } from 'lucide-react';
import { formatTimeDisplay } from '@/lib/time-utils';

interface PunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  punchType: 'in' | 'out';
  onSuccess: () => void;
}

export default function PunchModal({ isOpen, onClose, punchType, onSuccess }: PunchModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [locating, setLocating] = useState<boolean>(false);

  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize camera & geolocation on open
  useEffect(() => {
    if (isOpen) {
      startCamera();
      fetchLocation();
    } else {
      stopCamera();
      resetState();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const resetState = () => {
    setPhoto(null);
    setCountdown(null);
    setLocation(null);
    setAddress('');
    setPermissionError(null);
    setSubmitError(null);
    setSubmitting(false);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    setPermissionError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setPermissionError('Camera permission denied or not supported on this device. Please grant camera access to punch in/out.');
    }
  };

  const fetchLocation = async () => {
    if (!navigator.geolocation) {
      setAddress('Geolocation not supported on this device');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });

        // Reverse geocode via OpenStreetMap Nominatim
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: { 'Accept-Language': 'en' },
          });
          if (res.ok) {
            const data = await res.json();
            const fullAddress = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setAddress(fullAddress);
          } else {
            setAddress(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } catch (e) {
          setAddress(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.error('Location error:', err);
        setLocating(false);
        setAddress('Location permission denied or unavailable');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startCountdown = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      capturePhoto();
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror image horizontally for user-facing camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png', 0.85);
      setPhoto(dataUrl);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  // Save offline in IndexedDB fallback if network fails
  const saveToIndexedDB = async (payload: any) => {
    try {
      const dbRequest = indexedDB.open('fizz_pr_pwa', 1);
      dbRequest.onupgradeneeded = () => {
        const db = dbRequest.result;
        if (!db.objectStoreNames.contains('offline_punches')) {
          db.createObjectStore('offline_punches', { keyPath: 'id', autoIncrement: true });
        }
      };
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        const tx = db.transaction('offline_punches', 'readwrite');
        tx.objectStore('offline_punches').add({ ...payload, timestamp: Date.now() });
      };
    } catch (e) {
      console.error('IndexedDB save failed:', e);
    }
  };

  const handleSubmit = async () => {
    if (!photo) return;
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      photo,
      lat: location?.lat || null,
      lng: location?.lng || null,
      address: address || 'Location unavailable',
    };

    try {
      if (!navigator.onLine) {
        await saveToIndexedDB(payload);
        alert('You are currently offline. Your punch photo and location have been queued and will auto-sync when online!');
        stopCamera();
        onSuccess();
        onClose();
        return;
      }

      const res = await fetch('/api/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setSubmitError(data.error || 'Failed to submit punch');
      } else {
        stopCamera();
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Punch submission error:', err);
      // Save offline if network fetch throws
      await saveToIndexedDB(payload);
      alert('Network issue detected. Punch saved offline in PWA storage and will auto-sync!');
      stopCamera();
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {punchType === 'in' ? 'Clock In Punch' : 'Clock Out Punch'}
            </h3>
            <p className="text-xs text-slate-500">Capture live photo & location verification</p>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {permissionError ? (
            <div className="rounded-xl bg-red-50 p-4 text-center border border-red-150 space-y-3">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-xs font-semibold text-red-700">{permissionError}</p>
              <button
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700 transition"
              >
                <RefreshCw className="h-4 w-4" /> Retry Permissions
              </button>
            </div>
          ) : (
            <>
              {/* Camera / Photo Preview Container */}
              <div className="relative rounded-2xl bg-slate-900 overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-800 shadow-inner">
                {photo ? (
                  <img src={photo} alt="Captured Punch Photo" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />
                    {countdown !== null && (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center">
                        <span className="text-6xl font-extrabold text-white animate-bounce drop-shadow-lg">
                          {countdown}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Camera Actions */}
              {!photo ? (
                <div className="flex gap-2.5">
                  <button
                    onClick={startCountdown}
                    disabled={countdown !== null || !stream}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:bg-slate-300 transition touch-target"
                  >
                    <Camera className="h-4 w-4" /> 3s Auto Snap
                  </button>
                  <button
                    onClick={capturePhoto}
                    disabled={!stream}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition touch-target"
                  >
                    <Camera className="h-4 w-4 text-slate-500" /> Snap Now
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={retakePhoto}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retake Photo
                  </button>
                </div>
              )}

              {/* Location Details Card */}
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5 text-indigo-600">
                    <MapPin className="h-4 w-4" /> Location Verification
                  </span>
                  {locating && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                </div>
                <p className="text-xs text-slate-600 font-medium line-clamp-2">
                  {address || (locating ? 'Acquiring GPS coordinates...' : 'Location captured')}
                </p>
                {location && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
                  </p>
                )}
              </div>

              {submitError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {submitError}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50 flex gap-3">
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition touch-target"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!photo || submitting}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold text-white shadow transition touch-target ${
              punchType === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            } disabled:bg-slate-300 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" /> Confirm {punchType === 'in' ? 'Clock In' : 'Clock Out'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
