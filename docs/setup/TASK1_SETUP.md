# Task 1 Supabase setup

The web UI requires the database migration and account deletion Edge Function before these actions are available in production.

## Apply the database migration

Run `migrations/202609230001_task1_account_and_couple_constraints.sql` in the Supabase SQL Editor. It adds a transaction-safe rule limiting each account to one accepted couple partner and an authenticated RPC for ending a couple connection.

Run `migrations/202609230002_task2_connection_approval.sql` as well. It changes code-based connections into pending requests and allows only the addressed account to accept or reject them. Apply both migrations before the matching frontend deployment is used.

Run `migrations/202609240001_task2_chat_and_task3_edit_meals.sql` to enable owner-only message deletion and owner-only meal detail edits from the photo viewer. Apply it before using those controls in the new frontend.

The migration stops if existing accepted couple rows already give one account multiple partners. Resolve those rows in `public.connections`, then run the migration again. It does not delete or rewrite existing relationships automatically.

## Deploy the account deletion function

Authenticate the Supabase CLI and link this checkout to the project before deploying:

```sh
supabase login
supabase link --project-ref gjdutovmlpxrvwqycvay
```

Deploy `functions/delete-account/index.ts` with the Supabase CLI:

```sh
supabase functions deploy delete-account
```

The function uses Supabase's server-side `SUPABASE_SERVICE_ROLE_KEY` secret. Keep that key in Supabase function secrets; do not add it to Vercel frontend variables or commit it. The function verifies the caller's access token, removes all Storage objects owned by the account, clears current avatar references in other meals, then deletes the Auth user. Related public database rows cascade from the schema foreign keys.

The migration also adds a service-role-only helper that lists storage objects owned by a user. The function removes those objects from the existing `meal-photos` bucket before deleting the Auth user; Supabase blocks user deletion while that user still owns Storage objects. [Supabase account deletion guidance](https://supabase.com/docs/guides/auth/managing-user-data)
