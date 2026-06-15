"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const preview = username.trim().toLowerCase().replace(/[^a-z0-9_\-åäö]/gi, "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(data.error ?? "Något gick fel");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">🌿</div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a4a0e" }}>
            Välj ditt namn
          </h1>
          <p className="text-sm mt-2" style={{ color: "#5a8a40" }}>
            Det här namnet syns i turneringar och leaderboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Ditt namn..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl border-2 text-lg outline-none focus:border-green-500 transition-colors"
              style={{ borderColor: "#c5e8a0", background: "#f8fef4" }}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
            />
            {preview && preview !== username.trim() && (
              <p className="text-xs mt-1" style={{ color: "#8aad70" }}>
                Sparas som: <strong>{preview}</strong>
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: "#aac890" }}>
              2–20 tecken, bokstäver och siffror
            </p>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || preview.length < 2}
          >
            {loading ? "Sparar..." : "Kom igång 🌸"}
          </button>
        </form>
      </div>
    </main>
  );
}
