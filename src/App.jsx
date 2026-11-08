import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, SkipForward, SkipBack, Radio, Car,
  Plus, Trash2, Volume2, VolumeX, RefreshCw, AlertCircle,
  Star, Sparkles, RotateCcw
} from 'lucide-react';

// ============================================================================
// 1. FLUX DE RADIOS JAPONAISES PRÉCONFIGURÉS (11 STATIONS)
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
    type: 'mp3',
    color: '#06b6d4',
    isFavorite: true
  },
  {
    id: 'fm-odawara',
    presetNumber: 2,
    name: 'FM Odawara',
    kanji: 'FMおだわら',
    frequency: '87.9 FM',
    prefecture: 'Kanagawa',
    prefectureKanji: '神奈川',
    genre: 'Talk Local, Jazz & Culture',
    streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB019.stream/playlist.m3u8',
    type: 'hls',
    color: '#f59e0b',
    isFavorite: true
  },
  {
    id: 'fm-karuizawa',
    presetNumber: 3,
    name: 'FM Karuizawa',
    kanji: 'FM軽井沢',
    frequency: '77.5 FM',
    prefecture: 'Nagano',
    prefectureKanji: '長野',
    genre: 'Jazz, Détente & Infos Locales',
    streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB034.stream/playlist.m3u8',
    type: 'hls',
    color: '#10b981',
    isFavorite: true
  },
  {
    id: 'kyoto-living',
    presetNumber: 4,
    name: 'Kyoto Living FM',
    kanji: '京都リビングFM',
    frequency: '84.5 FM',
    prefecture: 'Kyoto',
    prefectureKanji: '京都',
    genre: 'Vie Locale & Musique Douce',
    streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB068.stream/playlist.m3u8',
    type: 'hls',
    color: '#ef4444',
    isFavorite: true
  },
  {
    id: 'kazusa-fm',
    presetNumber: 5,
    name: 'Kazusa FM',
    kanji: 'かずさFM',
    frequency: '83.4 FM',
    prefecture: 'Chiba',
    prefectureKanji: '千葉',
    genre: 'Émissions Parlées & Variétés',
    streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB021.stream/playlist.m3u8',
    type: 'hls',
    color: '#3b82f6',
    isFavorite: true
  },
  {
    id: 'j1-gold',
    presetNumber: 6,
    name: 'J1 Gold Tokyo',
    kanji: 'J1ゴールド東京',
    frequency: 'CITY POP',
    prefecture: 'Tokyo',
    prefectureKanji: '東京',
    genre: 'City Pop, Showa & Heisei Classics',
    streamUrl: 'https://jenny.torontocast.com:2000/stream/J1GOLD',
    type: 'mp3',
    color: '#eab308',
    isFavorite: true
  },
  {
    id: 'j1-hits',
    presetNumber: 7,
    name: 'J1 FM Tokyo',
    kanji: 'J1ヒッツ東京',
    frequency: 'J-POP HD',
    prefecture: 'Tokyo',
    prefectureKanji: '東京',
    genre: 'Top Charts J-Pop & Nouveautés',
    streamUrl: 'https://jenny.torontocast.com:2000/stream/J1HITS',
    type: 'mp3',
    color: '#ec4899',
    isFavorite: true
  },
  {
    id: 'listen-moe',
    presetNumber: 8,
    name: 'Listen.moe JP',
    kanji: '秋葉原ラジオ',
    frequency: '24/7 HD',
    prefecture: 'Akihabara',
    prefectureKanji: '秋葉原',
    genre: 'J-Pop, Anime & Future Funk (Sans Pub)',
    streamUrl: 'https://listen.moe/stream',
    type: 'mp3',
    color: '#8b5cf6',
    isFavorite: true
  },
  {
    id: 'fm-setagaya',
    presetNumber: 9,
    name: 'FM Setagaya',
    kanji: 'エフエム世田谷',
    frequency: '83.4 FM',
    prefecture: 'Setagaya, Tokyo',
    prefectureKanji: '世田谷',
    genre: 'Local, Talk & Musique',
    streamUrl: 'https://fmsetagaya834.out.airtime.pro/fmsetagaya834_a',
    fallbackUrl: 'https://fmsetagaya834.out.airtime.pro/fmsetagaya834_b',
    type: 'mp3',
    color: '#14b8a6',
    isFavorite: false
  },
  {
    id: 'wrep-live',
    presetNumber: 10,
    name: 'WREP LIVE',
    kanji: 'WREP 日本語ラップ',
    frequency: 'WEB',
    prefecture: 'Tokyo',
    prefectureKanji: '渋谷',
    genre: 'Japanese Hip-Hop & R&B',
    streamUrl: 'https://c13.radioboss.fm:18200/stream',
    fallbackUrl: 'https://c13.radioboss.fm:8200/stream',
    type: 'mp3',
    color: '#6366f1',
    isFavorite: false
  },
  {
    id: 'gotanno-fm',
    presetNumber: 11,
    name: 'Gotanno 89.2',
    kanji: '五反野FM',
    frequency: '89.2 FM',
    prefecture: 'Adachi, Tokyo',
    prefectureKanji: '足立',
    genre: 'Indie Pop & J-Pop',
    streamUrl: 'https://radio.gotanno.love/;',
    fallbackUrl: 'https://gotanno.love:8443/;',
    type: 'mp3',
    color: '#f43f5e',
    isFavorite: false
  }
];

// Catalogue supplémentaire JCBA en 1 clic
const BONUS_JCBA_CATALOG = [
  {
    id: 'sakura-fm',
    name: 'Sakura FM',
    kanji: 'さくらFM',
    frequency: '78.7 FM',
    prefecture: 'Hyogo (Nishinomiya)',
    prefectureKanji: '兵庫',
    genre: 'Musique & Infos Kansai',
    streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB064.stream/playlist.m3u8',
    type: 'hls',
    color: '#f43f5e'
  },
  {
    id: 'radio-monster',
    name: 'Radio Monster',
    kanji: 'ラジオモンスター',
    frequency: '76.2 FM',
    prefecture: 'Yamagata',
    prefectureKanji: '山形',
    genre: 'Talk & Pop du Tohoku',
    streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB006.stream/playlist.m3u8',
    type: 'hls',
    color: '#06b6d4'
  },
  {
    id: 'fm-kurashiki',
    name: 'FM Kurashiki',
    kanji: 'FMくらしき',
    frequency: '82.8 FM',
    prefecture: 'Okayama',
    prefectureKanji: '岡山',
    genre: 'Vie Locale & J-Music',
    streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB079.stream/playlist.m3u8',
    type: 'hls',
    color: '#14b8a6'
  },
  {
    id: 'dreams-fm',
    name: 'Dreams FM',
    kanji: 'ドリームスFM',
    frequency: '76.5 FM',
    prefecture: 'Fukuoka (Kurume)',
    prefectureKanji: '福岡',
    genre: 'Kyushu Local & Talk',
    streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB090.stream/playlist.m3u8',
    type: 'hls',
    color: '#f97316'
  }
];

const STORAGE_KEY = 'kuruma_fm_stations_v3';
const LAST_STATION_KEY = 'kuruma_fm_last_station_v3';

// ============================================================================
// 2. GÉNÉRATEUR DE POCHETTE POUR ÉCRAN D'AUTORADIO BLUETOOTH / CARPLAY
// ============================================================================
function generateCarArtworkDataUri(station) {
  const bg = '#090b10';
  const accent = (station.color && station.color.startsWith('#')) ? station.color : '#f59e0b';
  const freq = station.frequency || station.freq || 'FM';
  const kanji = station.prefectureKanji || '日本';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${bg}"/>
    <circle cx="256" cy="256" r="220" fill="none" stroke="${accent}" stroke-width="6" stroke-opacity="0.35"/>
    <circle cx="256" cy="256" r="190" fill="${accent}" fill-opacity="0.08"/>
    <rect x="46" y="46" width="420" height="420" rx="48" fill="none" stroke="${accent}" stroke-width="4" stroke-opacity="0.5"/>
    <text x="256" y="135" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-size="38" font-weight="800" letter-spacing="4">KURUMA FM 車</text>
    <text x="256" y="255" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="82" font-weight="900">${kanji}</text>
    <text x="256" y="345" text-anchor="middle" fill="${accent}" font-family="monospace" font-size="54" font-weight="900">${freq}</text>
    <text x="256" y="415" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="28" font-weight="700">${(station.name || '').toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Normalise n'importe quel objet station (ancien ou nouveau format)
function normalizeStation(st, idx) {
  const url = st.streamUrl || st.url || '';
  return {
    id: st.id || `station-${idx}`,
    presetNumber: st.presetNumber || idx + 1,
    name: st.name || 'Station JP',
    kanji: st.kanji || st.jpName || '日本ラジオ',
    frequency: st.frequency || st.freq || 'WEB',
    prefecture: st.prefecture || st.city || 'Japon',
    prefectureKanji: st.prefectureKanji || '日本',
    genre: st.genre || 'Japanese Radio',
    streamUrl: url,
    fallbackUrl: st.fallbackUrl || '',
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
  const [status, setStatus] = useState('idle'); // idle | loading | playing | error
  const [errorMsg, setErrorMsg] = useState('');
  const [carMode, setCarMode] = useState(true);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [newStation, setNewStation] = useState({
    name: '', kanji: '', frequency: '', prefecture: '', prefectureKanji: '', genre: '', streamUrl: '', color: '#f59e0b'
  });

  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const usingFallbackRef = useRef(false);

  const currentStation = stations[currentIndex] || stations[0];

  // Sauvegarde des stations et de la dernière station écoutée
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stations));
  }, [stations]);

  useEffect(() => {
    if (currentStation?.id) {
      localStorage.setItem(LAST_STATION_KEY, currentStation.id);
    }
  }, [currentStation]);

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
  }, []);

  const startStream = useCallback(async (stationToPlay, useBackup = false) => {
    if (!audioRef.current || !stationToPlay) return;
    clearTimeout(reconnectTimerRef.current);
    destroyHls();

    const targetUrl = (useBackup && stationToPlay.fallbackUrl)
      ? stationToPlay.fallbackUrl
      : stationToPlay.streamUrl;

    if (!targetUrl) {
      setStatus('error');
      setErrorMsg('URL du flux manquante');
      return;
    }

    setStatus('loading');
    setErrorMsg('');
    setIsPlaying(true);

    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.muted = isMuted;

    const isHlsStream = stationToPlay.type === 'hls' || targetUrl.includes('.m3u8');

    // Lecture HLS (.m3u8) sur Windows / Android / Chrome via hls.js
    if (isHlsStream && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(targetUrl);
      hls.attachMedia(audioRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        try {
          await audioRef.current.play();
          setStatus('playing');
        } catch (err) {
          setStatus('error');
          setErrorMsg('Cliquez sur Play pour autoriser l’audio');
          setIsPlaying(false);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          hls.destroy();
          setStatus('error');
          setErrorMsg('Flux HLS indisponible, reconnexion...');
          reconnectTimerRef.current = setTimeout(() => startStream(stationToPlay, false), 5000);
        }
      });
      return;
    }

    // Lecture native (MP3 / AAC ou HLS natif sur Safari iOS/macOS)
    try {
      audioRef.current.src = targetUrl;
      audioRef.current.load();
      await audioRef.current.play();
      setStatus('playing');
    } catch (err) {
      if (!useBackup && stationToPlay.fallbackUrl) {
        usingFallbackRef.current = true;
        startStream(stationToPlay, true);
      } else {
        setStatus('error');
        setErrorMsg('Flux bloqué ou hors-ligne (tentative 5s)');
        reconnectTimerRef.current = setTimeout(() => startStream(stationToPlay, false), 5000);
      }
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    if (isPlaying || status === 'loading') {
      stopStream();
    } else {
      usingFallbackRef.current = false;
      startStream(currentStation, false);
    }
  }, [isPlaying, status, stopStream, startStream, currentStation]);

  const selectAndPlayStation = useCallback((idx) => {
    usingFallbackRef.current = false;
    setCurrentIndex(idx);
    const targetStation = stations[idx];
    if (targetStation) {
      startStream(targetStation, false);
    }
  }, [stations, startStream]);

  const nextStation = useCallback(() => {
    const nextIdx = (currentIndex + 1) % stations.length;
    selectAndPlayStation(nextIdx);
  }, [currentIndex, stations.length, selectAndPlayStation]);

  const prevStation = useCallback(() => {
    const prevIdx = (currentIndex - 1 + stations.length) % stations.length;
    selectAndPlayStation(prevIdx);
  }, [currentIndex, stations.length, selectAndPlayStation]);

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      clearTimeout(reconnectTimerRef.current);
      destroyHls();
    };
  }, []);

  // Synchronisation Bluetooth Autoradio / CarPlay / Clavier PC avec Pochette SVG Dynamique
  useEffect(() => {
    if ('mediaSession' in navigator && currentStation) {
      const artworkUri = generateCarArtworkDataUri(currentStation);
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${currentStation.name} (${currentStation.frequency})`,
        artist: `${currentStation.kanji} • ${currentStation.prefecture}`,
        album: `${currentStation.genre} — KURUMA FM 車`,
        artwork: [
          { src: artworkUri, sizes: '512x512', type: 'image/svg+xml' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => startStream(currentStation, usingFallbackRef.current));
      navigator.mediaSession.setActionHandler('pause', stopStream);
      navigator.mediaSession.setActionHandler('previoustrack', prevStation);
      navigator.mediaSession.setActionHandler('nexttrack', nextStation);
    }
  }, [currentStation, startStream, stopStream, prevStation, nextStation]);

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

  const handleAddBonusStation = (bonus) => {
    if (stations.some(s => s.streamUrl === bonus.streamUrl)) return;
    const created = normalizeStation({
      ...bonus,
      presetNumber: stations.length + 1,
      isFavorite: true
    }, stations.length);
    setStations([...stations, created]);
  };

  const handleDeleteStation = (id) => {
    if (stations.length <= 1) return;
    const filtered = stations.filter(s => s.id !== id);
    setStations(filtered);
    if (currentIndex >= filtered.length) setCurrentIndex(0);
  };

  const handleResetDefaults = () => {
    stopStream();
    localStorage.removeItem(STORAGE_KEY);
    const defaults = DEFAULT_STATIONS.map(normalizeStation);
    setStations(defaults);
    setCurrentIndex(0);
  };

  const displayedStations = onlyFavorites
    ? stations.filter(s => s.isFavorite)
    : stations;

  const artworkPreview = currentStation ? generateCarArtworkDataUri(currentStation) : '';

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
          const isHls = currentStation?.type === 'hls' || currentStation?.streamUrl?.includes('.m3u8');
          if (isHls && Hls.isSupported()) return; // Géré par hls.js
          if (!usingFallbackRef.current && currentStation?.fallbackUrl) {
            usingFallbackRef.current = true;
            startStream(currentStation, true);
          } else if (isPlaying) {
            setStatus('error');
            setErrorMsg('Flux interrompu, reconnexion...');
            reconnectTimerRef.current = setTimeout(() => startStream(currentStation, false), 5000);
          }
        }}
      />

      {/* Barre supérieure */}
      <header className="flex items-center justify-between px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: currentStation?.color || '#ef4444' }}
          />
          <h1 className="text-lg font-bold tracking-wider">
            KURUMA FM <span className="text-zinc-500 font-normal text-sm">車FM</span>
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
        /* ================= MODE CONDUITE ================= */
        <main className="flex-1 flex flex-col justify-between p-4 sm:p-6 max-w-3xl mx-auto w-full gap-4">
          {/* Carte de la station active avec couleur dynamique et aperçu pochette Bluetooth */}
          <div
            className="rounded-3xl p-6 shadow-2xl flex flex-col justify-between min-h-[210px] border border-white/15 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${currentStation.color}dd 0%, ${currentStation.color}66 55%, #09090b 100%)`
            }}
          >
            <div className="flex justify-between items-start gap-2 z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-md text-xs font-extrabold tracking-widest uppercase">
                  #{currentStation.presetNumber} • {currentStation.frequency} • {currentStation.prefecture}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-bold uppercase">
                  {currentStation.type === 'hls' ? 'HLS .m3u8' : 'MP3/AAC'}
                </span>
              </div>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/55 flex items-center gap-1.5">
                {status === 'loading' && <><RefreshCw size={14} className="animate-spin text-amber-300" /> Connexion...</>}
                {status === 'playing' && <><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" /> EN DIRECT</>}
                {status === 'error' && <><AlertCircle size={14} className="text-amber-300" /> {errorMsg || 'Erreur flux'}</>}
                {status === 'idle' && 'PRÊT'}
              </span>
            </div>

            <div className="my-4 flex items-center justify-between gap-4 z-10">
              <div>
                <p className="text-white/85 text-sm font-semibold tracking-wide">
                  {currentStation.kanji} <span className="opacity-75">({currentStation.prefectureKanji})</span>
                </p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-0.5 drop-shadow">
                  {currentStation.name}
                </h2>
                <p className="text-white/90 text-sm mt-1 font-medium">{currentStation.genre}</p>
              </div>

              {/* Aperçu de la pochette envoyée à l'écran Bluetooth de la voiture */}
              <img
                src={artworkPreview}
                alt="CarPlay Artwork"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-white/20 shadow-lg hidden sm:block"
              />
            </div>
          </div>

          {/* Contrôles Géants */}
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

          {/* Grille des présélections (Presets) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {displayedStations.map((st) => {
              const realIdx = stations.findIndex(s => s.id === st.id);
              const isSelected = realIdx === currentIndex;
              return (
                <button
                  key={st.id}
                  onClick={() => selectAndPlayStation(realIdx)}
                  className={`p-3 rounded-2xl text-left border transition relative group ${
                    isSelected
                      ? 'bg-zinc-800/95 text-white shadow-lg'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-900'
                  }`}
                  style={{
                    borderColor: isSelected ? st.color : undefined
                  }}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span style={{ color: st.color }}>{st.frequency}</span>
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
                  <div className="text-[11px] text-zinc-500 truncate">{st.kanji} • {st.prefecture}</div>
                </button>
              );
            })}
          </div>

          {/* Barre de volume */}
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
        /* ================= GESTIONNAIRE DE STATIONS & CATALOGUE BONUS ================= */
        <main className="flex-1 p-5 max-w-3xl mx-auto w-full space-y-6">
          {/* Bouton de synchronisation avec le code VS Code */}
          <div className="flex items-center justify-between bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
            <div>
              <h3 className="font-bold text-sm text-zinc-200">Synchronisation du code (`DEFAULT_STATIONS`)</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Si tu modifies les stations dans VS Code, clique ici pour recharger la liste par défaut.
              </p>
            </div>
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition shrink-0"
            >
              <RotateCcw size={15} /> Réinitialiser
            </button>
          </div>

          {/* Catalogue Bonus JCBA en 1 clic */}
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
              <Sparkles size={16} /> Catalogue Bonus JCBA (Ajout en 1 clic)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BONUS_JCBA_CATALOG.map((bonus) => {
                const alreadyAdded = stations.some(s => s.streamUrl === bonus.streamUrl);
                return (
                  <div
                    key={bonus.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800"
                  >
                    <div className="truncate pr-2">
                      <div className="font-bold text-sm text-zinc-100">
                        {bonus.name} <span className="text-xs text-zinc-400">({bonus.frequency})</span>
                      </div>
                      <div className="text-xs text-zinc-500">{bonus.kanji} • {bonus.prefecture}</div>
                    </div>
                    <button
                      disabled={alreadyAdded}
                      onClick={() => handleAddBonusStation(bonus)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                        alreadyAdded
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                      }`}
                    >
                      {alreadyAdded ? 'Ajoutée' : '+ Ajouter'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulaire d'ajout manuel */}
          <form onSubmit={handleAddStation} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <h3 className="font-bold text-sm text-zinc-200 flex items-center gap-2">
              <Plus size={16} /> Ajouter un flux radio personnalisé
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Nom (ex: FM Okinawa)"
                value={newStation.name}
                onChange={e => setNewStation({ ...newStation, name: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
                required
              />
              <input
                type="text"
                placeholder="Nom Kanji (ex: FM沖縄)"
                value={newStation.kanji}
                onChange={e => setNewStation({ ...newStation, kanji: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Fréquence (ex: 87.3 FM)"
                value={newStation.frequency}
                onChange={e => setNewStation({ ...newStation, frequency: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Préfecture (ex: Okinawa)"
                value={newStation.prefecture}
                onChange={e => setNewStation({ ...newStation, prefecture: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Kanji Préf. (ex: 沖縄)"
                value={newStation.prefectureKanji}
                onChange={e => setNewStation({ ...newStation, prefectureKanji: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Genre musical"
                value={newStation.genre}
                onChange={e => setNewStation({ ...newStation, genre: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <input
              type="url"
              placeholder="URL directe du flux (.m3u8, .mp3, Airtime...)"
              value={newStation.streamUrl}
              onChange={e => setNewStation({ ...newStation, streamUrl: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
              required
            />
            <button type="submit" className="w-full bg-red-600 hover:bg-red-500 py-2.5 rounded-xl font-bold text-sm transition">
              Enregistrer la station
            </button>
          </form>

          {/* Liste des stations enregistrées */}
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
                    <span className="text-xs text-zinc-400">({st.frequency} • {st.kanji})</span>
                  </div>
                  <div className="text-xs text-zinc-500 truncate mt-0.5">{st.streamUrl}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => toggleFavorite(st.id, e)}
                    className="p-2 text-zinc-400 hover:text-amber-400 transition"
                  >
                    <Star size={18} fill={st.isFavorite ? '#fbbf24' : 'none'} color={st.isFavorite ? '#fbbf24' : 'currentColor'} />
                  </button>
                  <button
                    onClick={() => handleDeleteStation(st.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}