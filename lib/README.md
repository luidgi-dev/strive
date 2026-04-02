# lib/

Utility functions and client libraries.

## Structure

- `supabase/` — Supabase client instances and auth helpers
  - `client.ts` — Browser-safe client (public anon key)
  - `server.ts` — Server-safe client (service role key for RLS bypass)
- `utils.ts` — General utilities (formatters, validators, etc.)
- `constants.ts` — App-wide constants

## Usage

### Client-side auth
\`\`\`ts
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, anonKey)
\`\`\`

### Server-side (admin)
\`\`\`ts
const admin = createClient(url, serviceKey)
\`\`\`