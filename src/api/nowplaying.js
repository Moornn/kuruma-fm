export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, rgId, search } = req.query;

  // 1. Recherche de stations dans le catalogue Radio Garden
  if (search) {
    try {
      const rgRes = await fetch(
        `https://radio.garden/api/search?q=${encodeURIComponent(search)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const data = await rgRes.json();
      const results = (data?.hits?.hits || [])
        .map(h => h._source)
        .filter(s => s && s.type === 'channel')
        .map(s => {
          const rawUrl = s.url || s.page?.url || '';
          const parts = rawUrl.split('/').filter(Boolean);
          const channelId = parts[parts.length - 1];
          return {
            rgId: channelId,
            name: s.title || s.page?.title || 'Radio JP',
            subtitle: s.subtitle || s.page?.subtitle || 'Japon',
            streamUrl: `https://radio.garden/api/ara/content/listen/${channelId}/channel.mp3`
          };
        });
      return res.status(200).json({ results });
    } catch (e) {
      return res.status(200).json({ results: [], error: e.message });
    }
  }

  // 2. Lecture du Titre et de l'Artiste en direct (Protocole ICY)
  const targetUrl = rgId
    ? `https://radio.garden/api/ara/content/listen/${rgId}/channel.mp3`
    : url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Paramètre url ou rgId manquant' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Icy-MetaData': '1',
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18'
      },
      redirect: 'follow',
      signal: controller.signal
    });

    const metaintHeader = response.headers.get('icy-metaint');
    if (!metaintHeader || !response.body) {
      clearTimeout(timeout);
      controller.abort();
      return res.status(200).json({ title: null, artist: null, raw: null });
    }

    const metaint = parseInt(metaintHeader, 10);
    const reader = response.body.getReader();
    let buffer = new Uint8Array(0);

    while (buffer.length < metaint + 4096) {
      const { done, value } = await reader.read();
      if (done) break;

      const next = new Uint8Array(buffer.length + value.length);
      next.set(buffer);
      next.set(value, buffer.length);
      buffer = next;

      if (buffer.length > metaint) {
        const metaLength = buffer[metaint] * 16;
        if (metaLength === 0) break;

        if (buffer.length >= metaint + 1 + metaLength) {
          const metaBytes = buffer.slice(metaint + 1, metaint + 1 + metaLength);
          const metaString = new TextDecoder('utf-8').decode(metaBytes);
          const match = metaString.match(/StreamTitle='([^']*)'/i);

          if (match && match[1]) {
            const rawTitle = match[1].trim();
            let artist = '';
            let title = rawTitle;
            if (rawTitle.includes(' - ')) {
              const parts = rawTitle.split(' - ');
              artist = parts[0].trim();
              title = parts.slice(1).join(' - ').trim();
            }
            clearTimeout(timeout);
            controller.abort();
            return res.status(200).json({ title, artist, raw: rawTitle });
          }
          break;
        }
      }
    }

    clearTimeout(timeout);
    controller.abort();
    return res.status(200).json({ title: null, artist: null, raw: null });
  } catch (err) {
    clearTimeout(timeout);
    return res.status(200).json({ title: null, artist: null, raw: null });
  }
}