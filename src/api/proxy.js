export default async function handler(req, res) {
  // 1. Autoriser les requêtes CORS depuis ta PWA
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Paramètre ?url= manquant' });
  }

  try {
    const targetUrl = decodeURIComponent(url);
    const parsedUrl = new URL(targetUrl);

    // 2. Définir les en-têtes japonais attendus par JCBA / SimulRadio / MusicBird
    let referer = `${parsedUrl.origin}/`;
    let origin = parsedUrl.origin;

    if (
      targetUrl.includes('leanstream.co') ||
      targetUrl.includes('jcbasimul.com') ||
      targetUrl.includes('smen.biz') ||
      targetUrl.includes('smartstream.ne.jp')
    ) {
      referer = 'https://www.jcbasimul.com/';
      origin = 'https://www.jcbasimul.com';
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': referer,
        'Origin': origin,
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Le serveur radio a répondu avec le code ${response.status}`
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const isM3u8 =
      targetUrl.includes('.m3u8') ||
      contentType.includes('mpegurl') ||
      contentType.includes('apple.mpegurl');

    // 3. Si c'est une playlist HLS (.m3u8), on réécrit les liens des segments pour passer par le proxy
    if (isM3u8) {
      const manifestText = await response.text();

      const rewrittenManifest = manifestText
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;

          // Réécriture des URI à l'intérieur des balises #EXT-X-KEY ou #EXT-X-MAP
          if (trimmed.startsWith('#')) {
            return trimmed.replace(/URI="([^"]+)"/g, (_, uri) => {
              const absoluteUri = new URL(uri, targetUrl).href;
              return `URI="/api/proxy?url=${encodeURIComponent(absoluteUri)}"`;
            });
          }

          // Réécriture des sous-playlists (chunklist.m3u8) et segments audio (.ts / .aac)
          const absoluteSegmentUrl = new URL(trimmed, targetUrl).href;
          return `/api/proxy?url=${encodeURIComponent(absoluteSegmentUrl)}`;
        })
        .join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).send(rewrittenManifest);
    }

    // 4. Si c'est un segment audio binaire (.ts, .aac), on le renvoie directement au lecteur
    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType || 'video/mp2t');
    res.setHeader('Cache-Control', 'public, max-age=10');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    return res.status(500).json({
      error: 'Erreur de connexion au relais radio',
      details: error.message
    });
  }
}