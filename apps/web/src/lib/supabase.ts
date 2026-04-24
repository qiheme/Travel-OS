import { createClient } from '@supabase/supabase-js';

/* v8 ignore start */
export const supabase = createClient(
  import.meta.env['VITE_SUPABASE_URL'] as string,
  import.meta.env['VITE_SUPABASE_ANON_KEY'] as string,
);
/* v8 ignore end */
