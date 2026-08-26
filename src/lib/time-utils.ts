/**
 * Helper to format clock-in and clock-out timestamps consistently
 * across both Server Components (Vercel UTC) and Client Browsers (IST/Local).
 */
export function formatTimeDisplay(date: Date | string | null | undefined): string {
  if (!date) return '--:--';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--:--';

  try {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata', // Fizz PR Company Timezone (IST)
    });
  } catch (error) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Helper to format date strings consistently
 */
export function formatDateDisplay(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);

  try {
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  } catch (error) {
    return d.toLocaleDateString();
  }
}
