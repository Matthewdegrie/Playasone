"use client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton({ className = "" }: { className?: string }) {
  const onClick = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    // terug naar landing
    window.location.href = "/";
  };

  return (
    <button
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-sm font-semibold text-brand-navy bg-brand-primary hover:bg-[#68fe9a] transition ${className}`}
    >
      Uitloggen
    </button>
  );
}