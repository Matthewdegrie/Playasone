// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Only allow safe relative next paths (e.g. "/feed") to avoid open-redirects
function safeNextPath(nextParam: string | null): string {
  if (!nextParam) return "/";
  if (nextParam.startsWith("/")) return nextParam;
  return "/";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error");
  const providerErrorDesc = url.searchParams.get("error_description");
  const next = safeNextPath(url.searchParams.get("next"));

  // Prepare the response first so we can attach cookies to it
  const response = NextResponse.redirect(new URL(next, url.origin));
  response.headers.set("Cache-Control", "no-store");

  // Next.js 15: cookies() is async and returns ReadonlyRequestCookies
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // If the provider returned an error, send user back to login with context
  if (providerError) {
    const desc = providerErrorDesc ? `&reason=${encodeURIComponent(providerErrorDesc)}` : "";
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(providerError)}${desc}`, url.origin));
  }

  // Exchange the auth code for a Supabase session (sets cookies on the response)
  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      return NextResponse.redirect(new URL(`/auth/login?error=exchange_failed`, url.origin));
    }
  }

  return response;
}