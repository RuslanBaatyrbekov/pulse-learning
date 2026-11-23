// Edge Function: the observer creates a learner account from the app (Observer tab → Add learner).
// The secret key never leaves Supabase. Deploy: Edge Functions → create-learner → Code → paste → Deploy.
// Settings: "Verify JWT with legacy secret" OFF (this function checks the user itself).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function makePassword(): string {
  const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, b => abc[b % abc.length]).join('');
}

// Secret key: new-style projects expose SUPABASE_SECRET_KEYS (JSON), older ones SUPABASE_SERVICE_ROLE_KEY.
// A secret named SERVICE_KEY (Edge Functions → Secrets) overrides both.
function secretKey(): string {
  const own = Deno.env.get('SERVICE_KEY');
  if (own) return own;
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (keys) {
    try {
      const o = JSON.parse(keys);
      const v = o.default || Object.values(o)[0];
      if (v) return String(v);
    } catch {
      /* ignore */
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}

const VERSION = 'v5';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const auth = req.headers.get('Authorization') || '';
  const apikey = req.headers.get('apikey') || Deno.env.get('SUPABASE_ANON_KEY') || '';
  if (!/^Bearer\s+\S+/i.test(auth)) return json({ error: 'auth', detail: 'no token' }, 401);

  // 1. Check the caller: ask the Auth server directly who owns this token, then read observers with RLS.
  const hdr = { Authorization: auth, apikey };
  const who = await fetch(url + '/auth/v1/user', { headers: hdr });
  if (!who.ok) {
    const t = await who.text();
    console.error(VERSION, 'auth/v1/user', who.status, t.slice(0, 200));
    return json({ error: 'auth', detail: VERSION + ' user ' + who.status }, 401);
  }
  const me = await who.json();
  const obsRes = await fetch(
    url + '/rest/v1/observers?select=user_id&user_id=eq.' + encodeURIComponent(me.id),
    { headers: hdr }
  );
  const obs = obsRes.ok ? await obsRes.json() : [];
  if (!Array.isArray(obs) || !obs.length) {
    console.error(VERSION, 'not an observer', me.id, obsRes.status);
    return json({ error: 'forbidden', detail: VERSION }, 403);
  }

  // 2. Validate input.
  let body: { email?: string; password?: string; name?: string; course_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: 'body' }, 400);
  }
  const email = String(body.email || '')
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'email' }, 400);
  const password = String(body.password || '').trim() || makePassword();
  if (password.length < 8) return json({ error: 'password' }, 400);
  const name = String(body.name || '')
    .trim()
    .slice(0, 30);
  const course = String(body.course_id || '').trim();
  if (course && !/^[a-z0-9][a-z0-9_-]{0,39}$/.test(course)) return json({ error: 'course' }, 400);

  // 3. Create the account with the secret key.
  const key = secretKey();
  if (!key) {
    console.error(VERSION, 'no secret key in env');
    return json({ error: 'config', detail: VERSION + ' no secret key' }, 500);
  }
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // Several courses (migrations/001_multi_course.sql): give the learner access to the chosen course.
  const grant = async (userId: string): Promise<string | null> => {
    const { error } = await admin
      .from('course_access')
      .upsert({ user_id: userId, course_id: course }, { onConflict: 'user_id,course_id' });
    if (!error) return null;
    console.error(VERSION, 'grant failed:', error.message);
    return /foreign key|violates/i.test(error.message) ? 'course' : error.message;
  };

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { name } : {}
  });
  if (error) {
    const exists = /already/i.test(error.message);
    if (!exists || !course) {
      console.error(VERSION, 'createUser failed:', error.message);
      return json({ error: exists ? 'exists' : error.message }, 400);
    }
    // The account already exists: open the course to it instead.
    let found: string | null = null;
    for (let page = 1; page <= 20 && !found; page++) {
      const { data: list, error: le } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (le) {
        console.error(VERSION, 'listUsers failed:', le.message);
        break;
      }
      const u = list.users.find(x => (x.email || '').toLowerCase() === email);
      if (u) found = u.id;
      if (list.users.length < 1000) break;
    }
    if (!found) return json({ error: 'exists' }, 400);
    const ge = await grant(found);
    if (ge) return json({ error: ge }, 400);
    console.log(VERSION, 'granted', course, 'to', email);
    return json({ id: found, email, course_id: course, granted: true });
  }
  if (course && data.user) {
    const ge = await grant(data.user.id);
    if (ge) console.error(VERSION, 'created but not granted:', ge);
  }
  console.log(VERSION, 'created', email, course || '');
  return json({ id: data.user?.id, email, password, name, course_id: course || undefined });
});
