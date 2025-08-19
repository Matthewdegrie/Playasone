import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function FeedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?next=/feed");
  }

  const { user } = session;

  return (
    <main className="min-h-dvh px-6 py-8 bg-brand-navy text-white">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-semibold">League Feed</h1>
          <SignOutButton />
        </header>

        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-brand-paper/80">
            Ingelogd als <span className="font-medium">{user.email}</span>
          </p>
          <div className="mt-4 text-brand-paper/80">
            <p>🔧 Hier komt straks je echte feed (leaderboards, posts, games, …).</p>
            <p className="mt-1">Voor nu tonen we een skeleton zodat de auth-flow rond is.</p>
          </div>
        </section>
      </div>
    </main>
  );
}