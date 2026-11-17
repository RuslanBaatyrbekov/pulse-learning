/* Supabase connection.
   Both values: Supabase → Project Settings → API (Data API).
   The anon / publishable key is safe to publish: without a signed-in session it grants
   nothing, access is enforced by the Row Level Security policies in schema.sql.
   Never put the service_role / secret key here. */
window.PULS_CONFIG = {
  url: 'https://tiduoqdlhsjdevkubdrz.supabase.co',
  anonKey: 'sb_publishable_1ogy3oBDAhoYlQxznw4eCg_3zO7yG-F'
};
