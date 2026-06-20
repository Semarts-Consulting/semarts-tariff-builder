# Supabase Setup

This folder contains the first database schema for moving the MVP from browser-local storage to shared persistence.

## Apply Schema

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `schema.sql`.
4. Copy the project URL and anon key into `.env.local`.

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Current Persistence Status

The app still uses local browser storage as the working copy. Signed-in users can push the local browser copy to Supabase or restore the cloud copy back into local storage.

After running `schema.sql`, also run `002_auth_policies.sql` to add authenticated ownership and RLS policies.
