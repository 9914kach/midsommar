"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Fel lösenord, försök igen!");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">🌸</div>
          <h1 className="text-3xl font-bold" style={{ color: "#1a4a0e" }}>
            Midsommar 2026
          </h1>
          <p className="text-sm mt-2" style={{ color: "#4a7a35" }}>
            Ange lösenordet för att komma in
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <input
            type="password"
            placeholder="Lösenord..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 text-lg outline-none focus:border-green-500 transition-colors"
            style={{ borderColor: "#c5e8a0", background: "#f8fef4" }}
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Laddar..." : "Kom in 🌿"}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "#8aad70" }}>
          Fråga värden om lösenordet 🌻
        </p>
      </div>
    </main>
  );
}
