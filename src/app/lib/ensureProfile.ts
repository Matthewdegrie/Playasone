import { supabase } from "@/app/lib/supabaseClient";

/**
 * Maakt of update een profiel voor de ingelogde user.
 * Vereist: RLS policies met id = auth.uid() (SELECT/INSERT/UPDATE).
 */
export async function ensureProfile() {
  // 1) haal de huidige user op
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) return { ok: false, reason: `auth.getUser: ${userErr.message}` };
  const user = userData.user;
  if (!user) return { ok: false, reason: "Geen user in sessie" };

  // 2) upsert op id (MUST: id = user.id)
  const username =
    user.email?.split("@")[0] ?? user.id.slice(0, 8); // iets simpels als default

  const { error: upsertErr } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,            // <- heel belangrijk!
        username,
        full_name: null,
        avatar_url: null,
      },
      { onConflict: "id" }
    );

  if (upsertErr) return { ok: false, reason: `upsert: ${upsertErr.message}` };

  return { ok: true };
}