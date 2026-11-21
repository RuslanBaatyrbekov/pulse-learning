/* Supabase connection.
   Both values: Supabase → Project Settings → API (Data API).
   The anon / publishable key is safe to publish: without a signed-in session it grants
   nothing, access is enforced by the Row Level Security policies in schema.sql.
   Never put the service_role / secret key here. */
window.PULS_CONFIG = {
  url: 'https://tiduoqdlhsjdevkubdrz.supabase.co',
  anonKey: 'sb_publishable_1ogy3oBDAhoYlQxznw4eCg_3zO7yG-F',
  // Web Push public key (VAPID). Public by design; the private key lives only in Supabase secrets.
  vapidPublic: 'BC_VWRViiWp-ts1AtCf1el7FGFU3li7D04KIf4vGI7LBvuJt1OyoLFFoqd7gEBSoyh6WTHfvyyJeZ0wsBfIMojY'
};
