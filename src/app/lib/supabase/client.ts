'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Lees en valideer vereiste env-variabelen voor de browserclient.
 */
function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL ontbreekt. Zet deze in .env.local én in Vercel → Project → Settings → Environment Variables.'
    );
  }
  if (!anon) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY ontbreekt. Zet deze in .env.local én in Vercel → Project → Settings → Environment Variables.'
    );
  }
  return { url, anon };
}

/**
 * Singleton instance zodat we in de browser niet telkens opnieuw initialiseren.
 */
let _client: SupabaseClient | null = null;

/**
 * Haal de gedeelde Supabase Browser Client op (singleton).
 * Geschikt voor gebruik in Client Components, event handlers, enz.
 *
 * @example
 * const supabase = createSupabaseBrowserClient();
 * const { data } = await supabase.from('profiles').select('*');
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  if (_client) return _client;
  const { url, anon } = getEnv();
  _client = createBrowserClient(url, anon);
  return _client;
}

/**
 * Maak expliciet een nieuwe client (bijv. voor geïsoleerde flows/tests).
 * In 99% van de gevallen heb je deze niet nodig; gebruik de singleton hierboven.
 */
export function createFreshSupabaseBrowserClient(): SupabaseClient {
  const { url, anon } = getEnv();
  return createBrowserClient(url, anon);
}