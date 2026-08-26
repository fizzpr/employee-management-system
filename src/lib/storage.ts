import fs from 'fs';
import path from 'path';

/**
 * Uploads a base64 encoded photo (from canvas/webcam) or binary buffer
 * to the local filesystem at `public/uploads/attendance/`.
 * 
 * If S3 / Cloudinary / Vercel Blob credentials are provided in .env,
 * this function can be easily swapped or extended.
 */
export async function uploadAttendancePhoto(base64Data: string, userId: string, type: 'in' | 'out'): Promise<string> {
  try {
    if (!base64Data) return '';

    // Strip base64 header if present (e.g. data:image/png;base64,)
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'attendance');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `punch_${type}_${userId}_${Date.now()}.png`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/attendance/${filename}`;
  } catch (error) {
    console.error('Failed to save attendance photo:', error);
    // Fallback: return base64 data string if filesystem write fails
    return base64Data;
  }
}
