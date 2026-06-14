import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[var(--background)]">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="glass p-8 rounded-xl shadow-lg text-center w-full max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--primary)] mb-4">SettleSync</h1>
          <p className="text-[var(--text-secondary)] mb-8 text-lg">
            Manage shared expenses seamlessly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/login"
              className="bg-[var(--primary)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--secondary)] transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="bg-[var(--accent)] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
