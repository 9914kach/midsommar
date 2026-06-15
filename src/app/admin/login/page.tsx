"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Fel lösenord");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: "#fff7f0" }}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl p-8 shadow-lg border-2" style={{ background: "white", borderColor: "#c45000" }}>
          <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "#c45000" }}>Admin</h1>
          <p className="text-center text-sm mb-6" style={{ color: "#888" }}>Midsommar 2026</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Admin-lösenord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 rounded-xl px-4 py-3 text-base outline-none"
              style={{ borderColor: "#c45000" }}
              autoFocus
            />
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-base"
              style={{ background: loading ? "#e8945a" : "#c45000" }}
            >
              {loading ? "Loggar in..." : "Logga in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
