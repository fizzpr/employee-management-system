'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, Check } from 'lucide-react';

interface PwaContextType {
  canInstall: boolean;
  isStandalone: boolean;
  isIos: boolean;
  promptInstall: () => void;
  showIosGuide: boolean;
  setShowIosGuide: (show: boolean) => void;
}

const PwaContext = createContext<PwaContextType>({
  canInstall: false,
  isStandalone: false,
  isIos: false,
  promptInstall: () => {},
  showIosGuide: false,
  setShowIosGuide: () => {},
});

export const usePwa = () => useContext(PwaContext);

export default function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
        .catch((err) => console.error('PWA Service Worker registration failed:', err));
    }

    // 2. Check if launched in Standalone PWA mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    // 3. Detect iOS platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 4. Capture native beforeinstallprompt event (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Hide install prompt after appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsStandalone(true);
      console.log('Fizz PR PWA installed successfully');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setCanInstall(false);
          setDeferredPrompt(null);
        }
      });
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  return (
    <PwaContext.Provider
      value={{
        canInstall: canInstall || (isIos && !isStandalone),
        isStandalone,
        isIos,
        promptInstall,
        showIosGuide,
        setShowIosGuide,
      }}
    >
      {children}

      {/* iOS Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Close guide"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                F
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Install Fizz PR App</h3>
                <p className="text-xs text-slate-500">For iPhone & iPad Safari</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              Install <strong>Fizz PR Employee Portal</strong> on your iOS home screen for instant full-screen access and native app behavior:
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 shrink-0">
                  <Share className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">1. Tap the Share button</p>
                  <p className="text-xs text-slate-500">Located at the bottom of Safari browser bar</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 shrink-0">
                  <PlusSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">2. Select &quot;Add to Home Screen&quot;</p>
                  <p className="text-xs text-slate-500">Scroll down the share menu options</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 shrink-0">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">3. Tap &quot;Add&quot; in top right</p>
                  <p className="text-xs text-slate-500">Fizz PR app icon will appear on your home screen</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow hover:bg-indigo-700 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}
