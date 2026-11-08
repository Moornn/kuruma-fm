import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, SkipForward, SkipBack, Radio, Car,
  Plus, Trash2, Volume2, VolumeX, RefreshCw, AlertCircle,
  Star, RotateCcw, Music, Search, Globe
} from 'lucide-react';

// ============================================================================
// 1. STATIONS PAR DÉFAUT V6 (INCLUANT JAZZ SAKURA & RELAYAGE AUTOMATIQUE)
// ============================================================================
const DEFAULT_STATIONS = [
  {
    id: 'shonan-beach',
    presetNumber: 1,
    name: 'Shonan Beach FM',
    kanji: '湘南ビーチFM',
    frequency: '78.9 FM',
    prefecture: 'Zushi / Hayama',
    prefectureKanji: '湘南',
    genre: 'Jazz, Chill & Bord de mer',
    streamUrl: 'https://shonanbeachfm.out.airtime.pro/shonanbeachfm_c',
    fallbackUrl: 'https://shonanbeachfm.out.airtime.pro/shonanbeachfm_a',
    useProxy: false,
    color: '#06b6d4',
    isFavorite: true
  },
  {
    id: 'jazz-sakura',
    presetNumber: 2,
    name: 'Jazz Sakura',
    kanji: 'ジャズ桜',
    frequency: 'JAZZ JP',
    prefecture: 'Tokyo / Kyoto',
    prefectureKanji: '桜',
    genre: 'Japanese Jazz, Lounge & Bossa',
    streamUrl: 'http://cast1.torontocast.com:2120/;',
    useProxy: true, // Passe par /api/stream pour convertir le port HTTP 2120 en HTTPS
    color: '#ef4444',
    isFavorite: true
  },
  {
    id: 'fm-setagaya',
    presetNumber: 3,
    name: 'FM Setagaya',
    kanji: 'エフエム世田谷',
    frequency: '83.4 FM',
    prefecture: 'Setagaya, Tokyo',
    prefectureKanji: '世田谷',
    genre: 'Local, Talk & Musique',
    streamUrl: 'https://fmsetagaya834.out.airtime.pro/fmsetagaya834_a',
    fallbackUrl: 'https://fmsetagaya834.out.airtime.pro/fmsetagaya834_b',
    useProxy: false,
    color: '#10b981',
    isFavorite: true
  },
  {
    id: 'j1-gold',
    presetNumber: 4,
    name: 'J1 Gold Tokyo',
    kanji: 'J1ゴールド東京',
    frequency: 'CITY POP',
    prefecture: 'Tokyo',
    prefectureKanji: '東京',
    genre: 'City Pop, Showa & Heisei Classics',
    streamUrl: 'https://jenny.torontocast.com:2000/stream/J1GOLD',
    useProxy: false,
    color: '#eab308',
    isFavorite: true
  },
  {
    id: 'jpop-sakura',
    presetNumber: 5,
    name: 'J-Pop Sakura 80s',
    kanji: 'さくら懐メロ',
    frequency: 'SHOWA',
    prefecture: 'Tokyo',
    prefectureKanji: '昭和',
    genre: 'Classiques J-Pop 70s, 80s & 90s',
    streamUrl: 'http://igor.torontocast.com:1710/;',
    useProxy: true,
    color: '#ec4899',
    isFavorite: true
  },
  {
    id: 'j1-hits',
    presetNumber: 6,
    name: 'J1 FM Tokyo',
    kanji: 'J1ヒッツ東京',
    frequency: 'J-POP HD',
    prefecture: 'Tokyo',
    prefectureKanji: '東京',
    genre: 'Top Charts J-Pop & Nouveautés',
    streamUrl: 'https://jenny.torontocast.com:2000/stream/J1HITS',
    useProxy: false,
    color: '#f43f5e',
    isFavorite: true
  },
  {
    id: 'jrock-powerplay',
    presetNumber: 7,
    name: 'J-Rock Powerplay',
    kanji: 'Jロック・ラジオ',
    frequency: 'ROCK JP',
    prefecture: 'Osaka / Tokyo',
    prefectureKanji: '大阪',
    genre: 'Rock Japonais & Visual Kei',
    streamUrl: 'http://kathy.torontocast.com:3340/;',
    useProxy: true,
    color: '#14b8a6',
    isFavorite: true
  },
  {
    id: 'wrep-live',
    presetNumber: 8,
    name: 'WREP LIVE',
    kanji: 'WREP 日本語ラップ',
    frequency: 'HIP-HOP',
    prefecture: 'Shibuya, Tokyo',
    prefectureKanji: '渋谷',
    genre: 'Japanese Hip-Hop & R&B',
    streamUrl: 'https://c13.radioboss.fm:18200/stream',
    fallbackUrl: 'http://c13.radioboss.fm:8200/stream',
    useProxy: false,
    color: '#6366f1',
    isFavorite: true
  },
  {
    id: 'gotanno-fm',
    presetNumber: 9,
    name: 'Gotanno 89.2',
    kanji: '五反野FM',
    frequency: '89.2 FM',
    prefecture: 'Adachi, Tokyo',
    prefectureKanji: '足立',
    genre: 'Indie Pop & J-Pop',
    streamUrl: 'https://radio.gotanno.love/;',
    useProxy: false,
    color: '#f97316',
    isFavorite: true
  },
  {
    id: 'listen-moe',
    presetNumber: 10,
    name: 'Listen.moe JP',
    kanji: '秋葉原ラジオ',
    frequency: '24/7 HD',
    prefecture: 'Akihabara',
    prefectureKanji: '秋葉原',
    genre: 'J-Pop, Anime & Future Funk (Sans Pub)',
    streamUrl: 'https://listen.moe/stream',
    useProxy: false,
    color: '#8b5cf6',
    isFavorite: true
  }
];

const STORAGE_KEY = 'kuruma_fm_stations_v6';
const LAST_STATION_KEY = 'kuruma_fm_last_station_v6';

// ============================================================================
// 2. GÉNÉRATEUR D'ICÔNE PNG POUR IPHONE (APPLE-TOUCH-ICON) & POCHETTE CARPLAY
// ============================================================================
function injectIosHomeScreenIcon() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Fond noir carbone
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 512, 512);

    // Anneau externe
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(256, 256, 200, 0, Math.PI * 2);
    ctx.stroke();

    // Soleil rouge japonais
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(256, 210, 95, 0, Math.PI * 2);
    ctx.fill();

    // Kanji 車
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 105px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('車', 256, 214);

    // Cartouche KURUMA FM
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.fillRect(76, 345, 360, 84);
    ctx.strokeRect(76, 345, 360, 84);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px monospace';
    ctx.fillText('KURUMA FM', 256, 389);

    const pngUrl = canvas.toDataURL('image/png');
    let link = document.querySelector("link[rel='apple-touch-icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      document.head.appendChild(link);
    }
    link.href = pngUrl;
  } catch (e) {
    console.error(e);
  }
}

function generateCarArtworkDataUri(station, nowPlayingText) {
  const bg = '#090b10';
  const accent = (station.color && station.color.startsWith('#')) ? station.color : '#ef4444';
  const freq = station.frequency || 'FM';
  const kanji = station.prefectureKanji || '日本';
  const subtitle = (nowPlayingText || station.name || '').slice(0, 26).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${bg}"/>
    <circle cx="256" cy="256" r="220" fill="none" stroke="${accent}" stroke-width="6" stroke-opacity="0.35"/>
    <circle cx="256" cy="256" r="190" fill="${accent}" fill-opacity="0.08"/>
    <rect x="46" y="46" width="420" height="420" rx="48" fill="none" stroke="${accent}" stroke-width="4" stroke-opacity="0.5"/>
    <text x="256" y="135" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-size="38" font-weight="800" letter-spacing="4">KURUMA FM 車</text>
    <text x="256" y="255" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="82" font-weight="900">${kanji}</text>
    <text x="256" y="345" text-anchor="middle" fill="${accent}" font-family="monospace" font-size="50" font-weight="900">${freq}</text>
    <text x="256" y="415" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="24" font-weight="700">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function normalizeStation(st, idx) {
  const url = st.streamUrl || st.url || '';
  return {
    id: st.id || `station-${idx}`,
    presetNumber: st.presetNumber || idx + 1,
    name: st.name || 'Station JP',
    kanji: st.kanji || '日本ラジオ',
    frequency: st.frequency || 'WEB',
    prefecture: st.prefecture || 'Japon',
    prefectureKanji: st.prefectureKanji || '日本',
    genre: st.genre || 'Japanese Radio',
    streamUrl: url,
    fallbackUrl: st.fallbackUrl || '',
    rgId: st.rgId || '',
    useProxy: Boolean(st.useProxy || url.startsWith('http://') || st.rgId),
    type: st.type || (url.includes('.m3u8') ? 'hls' : 'mp3'),
    color: (st.color && st.color.startsWith('#')) ? st.color : '#ef4444',
    isFavorite: typeof st.isFavorite === 'boolean' ? st.isFavorite : true
  };
}

export default function App() {
  const [stations, setStations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeStation);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_STATIONS.map(normalizeStation);
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    const savedId = localStorage.getItem(LAST_STATION_KEY);
    if (savedId) {
      const idx = DEFAULT_STATIONS.findIndex(s => s.id === savedId);
      if (idx !== -1) return idx;
    }
    return 0;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [nowPlaying, setNowPlaying] = useState({ title: '', artist: '', raw: '' });
  const [carMode, setCarMode] = useState(true);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Recherche Radio Garden
  const [rgQuery, setRgQuery] = useState('');
  const [rgResults, setRgResults] = useState([]);
  const [rgLoading, setRgLoading] = useState(false);

  const [newStation, setNewStation] = useState({
    name: '', kanji: '', frequency: '', prefecture: '', prefectureKanji: '', genre: '', streamUrl: '', color: '#f59e0b'
  });

  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const triedProxyRef = useRef(false);

  const currentStation = stations[currentIndex] || stations[0];

  // Génère l'icône PNG pour l'écran d'accueil iPhone au démarrage
  useEffect(() => {
    injectIosHomeScreenIcon();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stations));
  }, [stations]);

  useEffect(() => {
    if (currentStation?.id) {
      localStorage.setItem(LAST_STATION_KEY, currentStation.id);
    }
  }, [currentStation]);

  // Récupération automatique du Titre et de l'Artiste toutes les 15 secondes
  const fetchNowPlaying = useCallback(async (station) => {
    if (!station) return;
    try {
      const queryParam = station.rgId
        ? `rgId=${encodeURIComponent(station.rgId)}`
        : `url=${encodeURIComponent(station.streamUrl)}`;
      const res = await fetch(`/api/nowplaying?${queryParam}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.raw) {
        setNowPlaying({
          title: data.title || data.raw,
          artist: data.artist || '',
          raw: data.raw
        });
      }
    } catch {
      // Ignore silencieusement si la radio n'envoie pas de métadonnées
    }
  }, []);

  useEffect(() => {
    setNowPlaying({ title: '', artist: '', raw: '' });
    if (!isPlaying || !currentStation) return;

    fetchNowPlaying(currentStation);
    const interval = setInterval(() => {
      fetchNowPlaying(currentStation);
    }, 15000);

    return () => clearInterval(interval);
  }, [isPlaying, currentStation, fetchNowPlaying]);

  const destroyHls = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  const stopStream = useCallback(() => {
    clearTimeout(reconnectTimerRef.current);
    destroyHls();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    setIsPlaying(false);
    setStatus('idle');
    setErrorMsg('');
    setNowPlaying({ title: '', artist: '', raw: '' });
  }, []);

  const startStream = useCallback(async (stationToPlay, forceProxy = false) => {
    if (!audioRef.current || !stationToPlay) return;
    clearTimeout(reconnectTimerRef.current);
    destroyHls();

    const useRelay = forceProxy || stationToPlay.useProxy || stationToPlay.streamUrl.startsWith('http://') || Boolean(stationToPlay.rgId);
    triedProxyRef.current = useRelay;

    const targetUrl = stationToPlay.rgId
      ? `/api/stream?rgId=${encodeURIComponent(stationToPlay.rgId)}`
      : useRelay
        ? `/api/stream?url=${encodeURIComponent(stationToPlay.streamUrl)}`
        : stationToPlay.streamUrl;

    setStatus('loading');
    setErrorMsg('');
    setIsPlaying(true);

    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.muted = isMuted;

    const isHlsStream = stationToPlay.type === 'hls' || stationToPlay.streamUrl.includes('.m3u8');

    if (isHlsStream && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hlsRef.current = hls;
      hls.loadSource(targetUrl);
      hls.attachMedia(audioRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        try {
          await audioRef.current.play();
          setStatus('playing');
        } catch {
          setStatus('error');
          setErrorMsg('Cliquez sur Play');
          setIsPlaying(false);
        }
      });
      return;
    }

    try {
      audioRef.current.src = targetUrl;
      audioRef.current.load();
      await audioRef.current.play();
      setStatus('playing');
    } catch {
      if (!useRelay) {
        // Si l'URL directe bloque, on bascule immédiatement sur le relais /api/stream
        startStream(stationToPlay, true);
      } else {
        setStatus('error');
        setErrorMsg('Reconnexion dans 5s...');
        reconnectTimerRef.current = setTimeout(() => startStream(stationToPlay, true), 5000);
      }
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    if (isPlaying || status === 'loading') {
      stopStream();
    } else {
      triedProxyRef.current = false;
      startStream(currentStation, false);
    }
  }, [isPlaying, status, stopStream, startStream, currentStation]);

  const selectAndPlayStation = useCallback((idx) => {
    triedProxyRef.current = false;
    setCurrentIndex(idx);
    const targetStation = stations[idx];
    if (targetStation) {
      startStream(targetStation, false);
    }
  }, [stations, startStream]);

  const nextStation = useCallback(() => {
    selectAndPlayStation((currentIndex + 1) % stations.length);
  }, [currentIndex, stations.length, selectAndPlayStation]);

  const prevStation = useCallback(() => {
    selectAndPlayStation((currentIndex - 1 + stations.length) % stations.length);
  }, [currentIndex, stations.length, selectAndPlayStation]);

  // Synchronisation Bluetooth Autoradio avec le Titre et l'Artiste en direct
  useEffect(() => {
    if ('mediaSession' in navigator && currentStation) {
      const artworkUri = generateCarArtworkDataUri(currentStation, nowPlaying.title);
      navigator.mediaSession.metadata = new MediaMetadata({
        title: nowPlaying.title
          ? `${nowPlaying.title}`
          : `${currentStation.name} (${currentStation.frequency})`,
        artist: nowPlaying.artist
          ? `${nowPlaying.artist} • ${currentStation.name}`
          : `${currentStation.kanji} • ${currentStation.prefecture}`,
        album: 'KURUMA FM 車',
        artwork: [
          { src: artworkUri, sizes: '512x512', type: 'image/svg+xml' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => startStream(currentStation, triedProxyRef.current));
      navigator.mediaSession.setActionHandler('pause', stopStream);
      navigator.mediaSession.setActionHandler('previoustrack', prevStation);
      navigator.mediaSession.setActionHandler('nexttrack', nextStation);
    }
  }, [currentStation, nowPlaying, startStream, stopStream, prevStation, nextStation]);

  // Recherche dans Radio Garden sans pub
  const handleSearchRadioGarden = async (e) => {
    e.preventDefault();
    if (!rgQuery.trim()) return;
    setRgLoading(true);
    try {
      const res = await fetch(`/api/nowplaying?search=${encodeURIComponent(rgQuery)}`);
      const data = await res.json();
      setRgResults(data.results || []);
    } catch {
      setRgResults([]);
    } finally {
      setRgLoading(false);
    }
  };

  const handleAddRgStation = (rgItem) => {
    if (stations.some(s => s.rgId === rgItem.rgId)) return;
    const created = normalizeStation({
      id: `rg-${rgItem.rgId}`,
      presetNumber: stations.length + 1,
      name: rgItem.name,
      kanji: 'ラジオガーデン',
      frequency: 'RG SANS PUB',
      prefecture: rgItem.subtitle,
      prefectureKanji: '日本',
      genre: 'Flux Radio Garden Direct',
      streamUrl: rgItem.streamUrl,
      rgId: rgItem.rgId,
      useProxy: true,
      color: '#10b981',
      isFavorite: true
    }, stations.length);
    setStations([...stations, created]);
  };

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setStations(stations.map(st => st.id === id ? { ...st, isFavorite: !st.isFavorite } : st));
  };

  const handleAddStation = (e) => {
    e.preventDefault();
    if (!newStation.name || !newStation.streamUrl) return;
    const created = normalizeStation({
      ...newStation,
      id: `custom-${Date.now()}`,
      presetNumber: stations.length + 1,
      isFavorite: true
    }, stations.length);
    setStations([...stations, created]);
    setNewStation({ name: '', kanji: '', frequency: '', prefecture: '', prefectureKanji: '', genre: '', streamUrl: '', color: '#f59e0b' });
  };

  const handleDeleteStation = (id) => {
    if (stations.length <= 1) return;
    const filtered = stations.filter(s => s.id !== id);
    setStations(filtered);
    if (currentIndex >= filtered.length) setCurrentIndex(0);
  };

  const handleResetDefaults = () => {
    stopStream();
    localStorage.clear();
    setStations(DEFAULT_STATIONS.map(normalizeStation));
    setCurrentIndex(0);
  };

  const displayedStations = onlyFavorites
    ? stations.filter(s => s.isFavorite)
    : stations;

  const artworkPreview = currentStation ? generateCarArtworkDataUri(currentStation, nowPlaying.title) : '';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col select-none font-sans">
      <audio
        ref={audioRef}
        playsInline
        onWaiting={() => setStatus('loading')}
        onPlaying={() => {
          setStatus('playing');
          setErrorMsg('');
        }}
        onError={() => {
          if (!triedProxyRef.current && currentStation) {
            startStream(currentStation, true);
          } else if (isPlaying) {
            setStatus('error');
            setErrorMsg('Reconnexion...');
            reconnectTimerRef.current = setTimeout(() => startStream(currentStation, true), 5000);
          }
        }}
      />

      <header className="flex items-center justify-between px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: currentStation?.color || '#ef4444' }}
          />
          <h1 className="text-lg font-bold tracking-wider">
            KURUMA FM <span className="text-zinc-500 font-normal text-sm">車FM v6</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {carMode && (
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-xs transition border ${
                onlyFavorites
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              <Star size={15} fill={onlyFavorites ? 'currentColor' : 'none'} />
              Favoris
            </button>
          )}
          <button
            onClick={() => setCarMode(!carMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition ${
              carMode ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-200'
            }`}
          >
            {carMode ? <><Radio size={18} /> Stations ({stations.length})</> : <><Car size={18} /> Mode Conduite</>}
          </button>
        </div>
      </header>

      {carMode ? (
        <main className="flex-1 flex flex-col justify-between p-4 sm:p-6 max-w-3xl mx-auto w-full gap-4">
          <div
            className="rounded-3xl p-6 shadow-2xl flex flex-col justify-between min-h-[225px] border border-white/15 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${currentStation.color}dd 0%, ${currentStation.color}66 55%, #09090b 100%)`
            }}
          >
            <div className="flex flex-wrap justify-between items-start gap-2 z-10">
              <span className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-md text-xs font-extrabold tracking-widest uppercase">
                #{currentStation.presetNumber} • {currentStation.frequency} • {currentStation.prefecture}
              </span>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/55 flex items-center gap-1.5">
                {status === 'loading' && <><RefreshCw size={14} className="animate-spin text-amber-300" /> Connexion...</>}
                {status === 'playing' && <><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" /> EN DIRECT</>}
                {status === 'error' && <><AlertCircle size={14} className="text-amber-300" /> {errorMsg || 'Erreur'}</>}
                {status === 'idle' && 'PRÊT'}
              </span>
            </div>

            <div className="my-3 flex items-center justify-between gap-4 z-10">
              <div className="min-w-0 flex-1">
                <p className="text-white/85 text-sm font-semibold tracking-wide">
                  {currentStation.kanji} <span className="opacity-75">({currentStation.prefectureKanji})</span>
                </p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-0.5 drop-shadow truncate">
                  {currentStation.name}
                </h2>
                <p className="text-white/80 text-xs sm:text-sm mt-0.5 font-medium truncate">{currentStation.genre}</p>
              </div>

              <img
                src={artworkPreview}
                alt="CarPlay Artwork"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-white/20 shadow-lg hidden sm:block shrink-0"
              />
            </div>

            {/* Bandeau Titre & Artiste en direct (Now Playing) */}
            <div className="z-10 bg-black/45 backdrop-blur-md rounded-2xl px-3.5 py-2.5 border border-white/10 flex items-center gap-2.5">
              <Music size={16} className="text-amber-300 shrink-0 animate-pulse" />
              <div className="truncate text-xs sm:text-sm">
                {nowPlaying.raw ? (
                  <>
                    <span className="font-bold text-white">{nowPlaying.title}</span>
                    {nowPlaying.artist && (
                      <span className="text-zinc-300"> — {nowPlaying.artist}</span>
                    )}
                  </>
                ) : (
                  <span className="text-zinc-300 italic">
                    {isPlaying ? 'Diffusion en direct (titre non communiqué par la station)' : 'Appuyez sur Écouter pour lancer le direct'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={prevStation}
              className="h-24 sm:h-28 rounded-3xl bg-zinc-900 border border-zinc-800 active:scale-95 transition flex flex-col items-center justify-center gap-2 hover:bg-zinc-800/80"
            >
              <SkipBack size={34} />
              <span className="text-xs text-zinc-400 font-semibold uppercase">Précédent</span>
            </button>

            <button
              onClick={togglePlay}
              className={`h-24 sm:h-28 rounded-3xl active:scale-95 transition flex flex-col items-center justify-center gap-2 shadow-xl ${
                isPlaying ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-950'
              }`}
            >
              {status === 'loading' ? (
                <RefreshCw size={40} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={40} fill="currentColor" />
              ) : (
                <Play size={40} fill="currentColor" className="ml-1" />
              )}
              <span className="text-xs font-bold uppercase">{isPlaying ? 'Stop' : 'Écouter'}</span>
            </button>

            <button
              onClick={nextStation}
              className="h-24 sm:h-28 rounded-3xl bg-zinc-900 border border-zinc-800 active:scale-95 transition flex flex-col items-center justify-center gap-2 hover:bg-zinc-800/80"
            >
              <SkipForward size={34} />
              <span className="text-xs text-zinc-400 font-semibold uppercase">Suivant</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {displayedStations.map((st) => {
              const realIdx = stations.findIndex(s => s.id === st.id);
              const isSelected = realIdx === currentIndex;
              return (
                <button
                  key={st.id}
                  onClick={() => selectAndPlayStation(realIdx)}
                  className={`p-3 rounded-2xl text-left border transition relative ${
                    isSelected
                      ? 'bg-zinc-800/95 text-white shadow-lg'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-900'
                  }`}
                  style={{ borderColor: isSelected ? st.color : undefined }}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="truncate" style={{ color: st.color }}>{st.frequency}</span>
                    <span
                      onClick={(e) => toggleFavorite(st.id, e)}
                      className="text-zinc-500 hover:text-amber-400 p-0.5"
                    >
                      <Star
                        size={13}
                        fill={st.isFavorite ? '#fbbf24' : 'none'}
                        color={st.isFavorite ? '#fbbf24' : 'currentColor'}
                      />
                    </span>
                  </div>
                  <div className="font-bold text-sm truncate mt-0.5">{st.name}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{st.kanji}</div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/70 px-4 py-3 rounded-2xl border border-zinc-800/80">
            <button
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                if (audioRef.current) audioRef.current.muted = nextMute;
              }}
              className="text-zinc-400 hover:text-white"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                setIsMuted(val === 0);
                if (audioRef.current) {
                  audioRef.current.volume = val;
                  audioRef.current.muted = val === 0;
                }
              }}
              className="w-full accent-red-500 cursor-pointer"
            />
          </div>
        </main>
      ) : (
        <main className="flex-1 p-5 max-w-3xl mx-auto w-full space-y-6">
          {/* Moteur de recherche Radio Garden sans pub */}
          <div className="bg-zinc-900 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
            <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <Globe size={17} /> Importer depuis Radio Garden (Flux direct sans pub)
            </h3>
            <form onSubmit={handleSearchRadioGarden} className="flex gap-2">
              <input
                type="text"
                placeholder="Chercher une ville ou radio (ex: Karuizawa, Tokyo, Jazz, Okinawa...)"
                value={rgQuery}
                onChange={e => setRgQuery(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={rgLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 shrink-0"
              >
                <Search size={16} /> {rgLoading ? '...' : 'Chercher'}
              </button>
            </form>

            {rgResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {rgResults.map((item) => {
                  const added = stations.some(s => s.rgId === item.rgId);
                  return (
                    <div key={item.rgId} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="truncate pr-2">
                        <div className="font-bold text-sm text-zinc-100 truncate">{item.name}</div>
                        <div className="text-xs text-zinc-500 truncate">{item.subtitle}</div>
                      </div>
                      <button
                        disabled={added}
                        onClick={() => handleAddRgStation(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ${
                          added ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                        }`}
                      >
                        {added ? 'Ajoutée' : '+ Ajouter'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
            <div>
              <h3 className="font-bold text-sm text-zinc-200">Recharger les 10 stations par défaut (v6)</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Charge Jazz Sakura, J-Pop Sakura, Shonan Beach FM, J1 Gold, etc.
              </p>
            </div>
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition shrink-0"
            >
              <RotateCcw size={15} /> Réinitialiser
            </button>
          </div>

          <form onSubmit={handleAddStation} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <h3 className="font-bold text-sm text-zinc-200 flex items-center gap-2">
              <Plus size={16} /> Ajouter une URL personnalisée
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nom de la station"
                value={newStation.name}
                onChange={e => setNewStation({ ...newStation, name: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
                required
              />
              <input
                type="text"
                placeholder="Fréquence / Ville"
                value={newStation.frequency}
                onChange={e => setNewStation({ ...newStation, frequency: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <input
              type="url"
              placeholder="URL du flux (http:// ou https://)"
              value={newStation.streamUrl}
              onChange={e => setNewStation({ ...newStation, streamUrl: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
              required
            />
            <button type="submit" className="w-full bg-red-600 hover:bg-red-500 py-2.5 rounded-xl font-bold text-sm transition">
              Enregistrer la station
            </button>
          </form>

          <div className="space-y-2">
            {stations.map((st, idx) => (
              <div key={st.id} className="flex items-center justify-between p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800">
                <div
                  onClick={() => { selectAndPlayStation(idx); setCarMode(true); }}
                  className="cursor-pointer flex-1 truncate pr-3"
                >
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                    #{st.presetNumber} {st.name}
                    <span className="text-xs text-zinc-400">({st.frequency})</span>
                  </div>
                  <div className="text-xs text-zinc-500 truncate mt-0.5">{st.streamUrl}</div>
                </div>
                <button
                  onClick={() => handleDeleteStation(st.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}