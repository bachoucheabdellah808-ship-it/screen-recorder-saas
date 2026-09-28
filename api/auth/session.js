import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_KEY ?? ''
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const session = data.session;
    const user = session?.user ?? null;

    if (!user) {
      return res.status(200).json({ data: { session: null } });
    }

    return res.status(200).json({
      data: {
        session: {
          user: {
            id: user.id,
            email: user.email ?? '',
          },
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
}
