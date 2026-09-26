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
    return res.status(200).send('');
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .storage
      .from('recordings')
      .list('recordings', { limit: 100, offset: 0 });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const items = (data ?? []).map((file) => ({
      path: file.path,
      url: supabase.storage.from('recordings').getPublicUrl(file.path).data.publicUrl,
      sizeBytes: file.name,
    }));

    return res.status(200).json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
