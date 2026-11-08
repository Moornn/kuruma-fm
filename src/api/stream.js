import net from 'net';
import tls from 'tls';

function pipeRadioSocket(urlString, req, res, redirectsLeft = 3) {
  if (redirectsLeft <= 0) {
    res.statusCode = 502;
    return res.end('Trop de redirections');
  }

  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    res.statusCode = 400;
    return res.end('URL invalide');
  }

  const isHttps = parsed.protocol === 'https:';
  const port = parsed.port ? parseInt(parsed.port, 10) : (isHttps ? 443 : 80);
  const host = parsed.hostname;

  // Sur Shoutcast v2, /stream renvoie un flux plus stable que /;
  let path = (parsed.pathname || '/') + (parsed.search || '');
  if (path === '/' || path.endsWith('/;')) {
    path = '/stream';
  }

  const options = isHttps
    ? { host, port, servername: host, rejectUnauthorized: false }
    : { host, port };

  const socket = isHttps ? tls.connect(options) : net.connect(options);
  socket.setTimeout(8000);

  let headersParsed = false;
  let headerBuffer = Buffer.alloc(0);

  const sendGetRequest = () => {
    const rawReq = [
      `GET ${path} HTTP/1.0`,
      `Host: ${host}:${port}`,
      `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)`,
      `Accept: */*`,
      `Icy-MetaData: 0`,
      `Connection: close`,
      `\r\n`
    ].join('\r\n');
    socket.write(rawReq);
  };

  if (isHttps) {
    socket.once('secureConnect', sendGetRequest);
  } else {
    socket.once('connect', sendGetRequest);
  }

  socket.on('data', (chunk) => {
    if (headersParsed) {
      res.write(chunk);
      return;
    }

    headerBuffer = Buffer.concat([headerBuffer, chunk]);
    const headerEnd = headerBuffer.indexOf('\r\n\r\n');

    if (headerEnd !== -1) {
      headersParsed = true;
      const headerText = headerBuffer.slice(0, headerEnd).toString('latin1');
      const audioBody = headerBuffer.slice(headerEnd + 4);
      const lines = headerText.split('\r\n');
      const statusLine = lines[0] || '';

      // Suivi des redirections HTTP 301/302/307/308
      if (/^HTTP\/\d\.\d\s+30[12378]/.test(statusLine)) {
        const locLine = lines.find(l => l.toLowerCase().startsWith('location:'));
        if (locLine) {
          const nextUrl = new URL(locLine.slice(9).trim(), urlString).href;
          socket.destroy();
          return pipeRadioSocket(nextUrl, req, res, redirectsLeft - 1);
        }
      }

      let contentType = 'audio/mpeg';
      const ctLine = lines.find(l => l.toLowerCase().startsWith('content-type:'));
      if (ctLine) {
        contentType = ctLine.slice(13).trim();
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive'
      });

      if (audioBody.length > 0) {
        res.write(audioBody);
      }
    }
  });

  socket.on('timeout', () => {
    socket.destroy();
    if (!res.headersSent) res.status(504).end('Timeout');
    else res.end();
  });

  socket.on('error', (err) => {
    socket.destroy();
    if (!res.headersSent) res.status(502).end(err.message);
    else res.end();
  });

  socket.on('end', () => res.end());
  req.on('close', () => socket.destroy());
}

export default function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send('Paramètre ?url= manquant');
  }
  pipeRadioSocket(decodeURIComponent(url), req, res);
}