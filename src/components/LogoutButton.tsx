"use client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button onClick={handleLogout} className="text-[var(--error)] hover:underline font-medium transition-colors">
      Logout
    </button>
  );
}
