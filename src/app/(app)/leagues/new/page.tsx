"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

export default function NewLeaguePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Bezig...");

    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr || !u.user) {
      setStatus("Niet ingelogd.");
      return;
    }

    // 1) league aanmaken met owner_id = jij
    const { data: league, error: e1 } = await supabase
      .from("leagues")
      .insert({ name, owner_id: u.user.id })
      .select()
      .single();

    if (e1 || !league) {
      setStatus(`❌ ${e1?.message ?? "League aanmaken mislukt"}`);
      return;
    }

    // 2) jezelf als member toevoegen (role: owner)
    const { error: e2 } = await supabase.from("league_members").insert({
      league_id: league.id,
      user_id: u.user.id,
      role: "owner",
    });

    if (e2) {
      setStatus(`⚠️ League gemaakt, maar member insert faalde: ${e2.message}`);
      return;
    }

    setStatus("✅ League aangemaakt.");
    router.replace("/dashboard");
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">Nieuwe league</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <div className="mb-1 text-sm">Naam</div>
          <input
            className="w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
            disabled={!name}
          >
            Aanmaken
          </button>

          <a
            href="/dashboard"
            className="rounded border px-3 py-2"
          >
            Annuleren
          </a>
        </div>
      </form>

      <p className="text-sm text-gray-600">{status}</p>
    </main>
  );
}