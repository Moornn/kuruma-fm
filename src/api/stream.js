export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const rgId = searchParams.get('rgId');

  if (!targetUrl && !rgId) {
    return new Response('Paramètre url ou rgId manquant', { status: 400 });
  }

  // Si c'est un ID Radio Garden, on pointe directement vers le flux brut sans pub
  const streamUrl = rgId
    ? `https://radio.garden/api/ara/content/listen/${rgId}/channel.mp3`
    : targetUrl;

  try {
    const response = await fetch(streamUrl, {
      headers: {
        // User-Agent VLC pour forcer Shoutcast/Icecast à renvoyer le flux audio brut
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        'Accept': '*/*',
        'Icy-MetaData': '0'
      },
      redirect: 'follow'
    });

    if (!response.ok || !response.body) {
      return new Response(`Erreur serveur radio: ${response.status}`, { status: response.status });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    return new Response(`Erreur relais: ${err.message}`, { status: 500 });
  }
}