import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <h1 className="text-6xl font-extrabold text-indigo-600">404</h1>
      <h2 className="mt-4 text-xl font-bold text-slate-800">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-550 max-w-xs mx-auto">
        The page you are trying to reach does not exist or has been relocated.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
      >
        Return to Portal
      </Link>
    </div>
  );
}
