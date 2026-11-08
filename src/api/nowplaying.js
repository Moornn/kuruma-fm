import net from 'net';
import tls from 'tls';

function fetchIcyMetadata(urlString, redirectsLeft = 2) {
  return new Promise((resolve) => {
    if (redirectsLeft <= 0) return resolve({ title: null, artist: null, raw: null });

    let parsed;
    try {
      parsed = new URL(urlString);
    } catch {
      return resolve({ title: null, artist: null, raw: null });
    }

    const isHttps = parsed.protocol === 'https:';
    const port = parsed.port ? parseInt(parsed.port, 10) : (isHttps ? 443 : 80);
    const host = parsed.hostname;
    let path = (parsed.pathname || '/') + (parsed.search || '');
    if (path === '/' || path.endsWith('/;')) path = '/stream';

    const options = isHttps
      ? { host, port, servername: host, rejectUnauthorized: false }
      : { host, port };

    const socket = isHttps ? tls.connect(options) : net.connect(options);
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ title: null, artist: null, raw: null });
    }, 3500);

    const finish = (result) => {
      clearTimeout(timer);
      socket.destroy();
      resolve(result);
    };

    const sendRequest = () => {
      const reqStr = [
        `GET ${path} HTTP/1.0`,
        `Host: ${host}:${port}`,
        `User-Agent: VLC/3.0.18`,
        `Icy-MetaData: 1`,
        `Connection: close`,
        `\r\n`
      ].join('\r\n');
      socket.write(reqStr);
    };

    if (isHttps) socket.once('secureConnect', sendRequest);
    else socket.once('connect', sendRequest);

    let buffer = Buffer.alloc(0);
    let metaint = -1;
    let bodyStart = -1;

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      if (bodyStart === -1) {
        const idx = buffer.indexOf('\r\n\r\n');
        if (idx !== -1) {
          bodyStart = idx + 4;
          const headers = buffer.slice(0, idx).toString('latin1').split('\r\n');
          const status = headers[0] || '';

          if (/^HTTP\/\d\.\d\s+30[12378]/.test(status)) {
            const loc = headers.find(h => h.toLowerCase().startsWith('location:'));
            if (loc) {
              clearTimeout(timer);
              socket.destroy();
              const nextUrl = new URL(loc.slice(9).trim(), urlString).href;
              return resolve(fetchIcyMetadata(nextUrl, redirectsLeft - 1));
            }
          }

          const metaHeader = headers.find(h => h.toLowerCase().startsWith('icy-metaint:'));
          if (metaHeader) {
            metaint = parseInt(metaHeader.slice(12).trim(), 10);
          } else {
            return finish({ title: null, artist: null, raw: null });
          }
        }
      }

      if (bodyStart !== -1 && metaint > 0) {
        const audioAndMeta = buffer.slice(bodyStart);
        if (audioAndMeta.length > metaint) {
          const metaLen = audioAndMeta[metaint] * 16;
          if (metaLen === 0) {
            return finish({ title: null, artist: null, raw: null });
          }
          if (audioAndMeta.length >= metaint + 1 + metaLen) {
            const metaBytes = audioAndMeta.slice(metaint + 1, metaint + 1 + metaLen);
            const metaStr = new TextDecoder('utf-8').decode(metaBytes);
            const match = metaStr.match(/StreamTitle='([^']*)'/i);
            if (match && match[1]) {
              const rawTitle = match[1].trim();
              let artist = '';
              let title = rawTitle;
              if (rawTitle.includes(' - ')) {
                const parts = rawTitle.split(' - ');
                artist = parts[0].trim();
                title = parts.slice(1).join(' - ').trim();
              }
              return finish({ title, artist, raw: rawTitle });
            }
            return finish({ title: null, artist: null, raw: null });
          }
        }
      }
    });

    socket.on('error', () => finish({ title: null, artist: null, raw: null }));
    socket.on('end', () => finish({ title: null, artist: null, raw: null }));
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { url } = req.query;
  if (!url) return res.status(400).json({ title: null, artist: null, raw: null });

  const data = await fetchIcyMetadata(decodeURIComponent(url));
  return res.status(200).json(data);
}