"use client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function getOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function GoogleButton({ label = "Log in met Google" }: { label?: string }) {
  const onClick = async () => {
    const supabase = createSupabaseBrowserClient();
    const origin = getOrigin();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={onClick}
      className="w-full rounded-md px-4 py-2 text-sm font-semibold text-brand-navy bg-brand-primary hover:bg-[#68fe9a] transition"
    >
      {label}
    </button>
  );
}