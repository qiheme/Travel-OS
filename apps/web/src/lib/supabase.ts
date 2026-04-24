import { createClient } from '@supabase/supabase-js';

/* v8 ignore start */
export const supabase = createClient(
  import.meta.env['VITE_SUPABASE_URL'] ?? 'https://placeholder.supabase.co',
  import.meta.env['VITE_SUPABASE_ANON_KEY'] ?? 'placeholder-key',
);
/* v8 ignore end */
