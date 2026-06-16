"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NyTurneringPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [format, setFormat] = useState<"bracket" | "round_robin" | "free" | "multi_event">("round_robin");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, game, format }),
    });
    setSaving(false);
    if (res.ok) {
      const { tournament } = await res.json();
      router.push(`/admin/turnering/${tournament.id}`);
    } else {
      setError("Något gick fel");
    }
  }

  return (
    <main className="min-h-screen p-4" style={{ background: "#fff7f0" }}>
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl p-4 mb-6 border-2" style={{ background: "#c45000", borderColor: "#a03800" }}>
          <h1 className="text-2xl font-bold text-white">Ny turnering</h1>
        </div>

        <form onSubmit={handleSubmit} className="card p-5 flex flex-col gap-4" style={{ borderColor: "#e8c4a0", borderWidth: 2 }}>
          <div>
            <label className="block font-medium text-sm mb-1 text-gray-700">Turneringsnamn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-base"
              style={{ borderColor: "#e8c4a0" }}
              placeholder="T.ex. Beer Pong Championship"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-sm mb-1 text-gray-700">Spel</label>
            <input
              type="text"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-base"
              style={{ borderColor: "#e8c4a0" }}
              placeholder="T.ex. Beer Pong"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-sm mb-2 text-gray-700">Format</label>
            <div className="flex flex-col gap-2">
              {[
                { value: "round_robin", label: "Round Robin", desc: "Alla möter alla" },
                { value: "bracket", label: "Bracket", desc: "Utslagsspel" },
                { value: "free", label: "Fri", desc: "Manuella matcher" },
                { value: "multi_event", label: "Femkamp / Mångkamp", desc: "Flera grenar, totalpoäng avgör" },
              ].map((f) => (
                <label
                  key={f.value}
                  className="flex items-start gap-3 rounded-xl p-3 cursor-pointer border-2"
                  style={{ borderColor: format === f.value ? "#c45000" : "#e8c4a0", background: format === f.value ? "#fff0e8" : "white" }}
                >
                  <input
                    type="radio"
                    name="format"
                    value={f.value}
                    checked={format === f.value}
                    onChange={() => setFormat(f.value as "bracket" | "round_robin" | "free" | "multi_event")}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{f.label}</div>
                    <div className="text-sm text-gray-500">{f.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-white"
            style={{ background: saving ? "#e8945a" : "#c45000" }}
          >
            {saving ? "Skapar..." : "Skapa turnering"}
          </button>
        </form>
      </div>
    </main>
  );
}
