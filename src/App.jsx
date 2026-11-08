import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Radio, Car,
  Plus, Trash2, Volume2, VolumeX, RefreshCw, AlertCircle
} from 'lucide-react';

const DEFAULT_STATIONS = [
  {
    id: 'shonan-beach',
    name: 'Shonan Beach FM',
    jpName: '湘南ビーチFM',
    freq: '78.9 FM',
    city: 'Zushi / Hayama',
    genre: 'Jazz / Chill / Bord de mer',
    url: 'https://shonanbeachfm.out.airtime.pro/shonanbeachfm_a',
    fallbackUrl: 'https://shonanbeachfm.out.airtime.pro/shonanbeachfm_c',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'wrep-live',
    name: 'WREP LIVE',
    jpName: 'WREP 日本語ラップ',
    freq: 'WEB',
    city: 'Tokyo',
    genre: 'Japanese Hip-Hop / R&B',
    url: 'https://c13.radioboss.fm:18200/stream',
    fallbackUrl: 'https://c13.radioboss.fm:8200/stream',
    color: 'from-purple-600 to-indigo-700'
  },
  {
    id: 'gotanno-fm',
    name: 'Gotanno 89.2',
    jpName: '五反野FM',
    freq: '89.2 FM',
    city: 'Adachi, Tokyo',
    genre: 'Indie Pop / J-Pop',
    url: 'https://radio.gotanno.love/;',
    fallbackUrl: 'https://gotanno.love:8443/;',
    color: 'from-pink-500 to-rose-600'
  },
  {
    id: 'fm-setagaya',
    name: 'FM Setagaya',
    jpName: 'エフエム世田谷',
    freq: '83.4 FM',
    city: 'Setagaya, Tokyo',
    genre: 'Local / Talk / Musique',
    url: 'https://fmsetagaya834.out.airtime.pro/fmsetagaya834_a',
    fallbackUrl: 'https://fmsetagaya834.out.airtime.pro/fmsetagaya834_b',
    color: 'from-emerald-500 to-teal-600'
  },
    {
    id: 'fm-odawara',
    presetNumber: 1,
    name: 'FM Odawara',
    kanji: 'FMおだわら',
    frequency: '87.9 FM',
    prefecture: 'Kanagawa',
    prefectureKanji: '神奈川',
    genre: 'Talk Local, Jazz & Culture',
    streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB019.stream/playlist.m3u8',
    type: 'hls',
    color: '#f59e0b', // Amber
    isFavorite: true
  },
  {
    id: 'fm-karuizawa',
    presetNumber: 2,
    name: 'FM Karuizawa',
    kanji: 'FM軽井沢',
    frequency: '77.5 FM',
    prefecture: 'Nagano',
    prefectureKanji: '長野',
    genre: 'Jazz, Détente & Infos Locales',
    streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB034.stream/playlist.m3u8',
    type: 'hls',
    color: '#10b981', // Emerald
    isFavorite: true
  },
  {
    id: 'kyoto-living',
    presetNumber: 3,
    name: 'Kyoto Living FM',
    kanji: '京都リビングFM',
    frequency: '84.5 FM',
    prefecture: 'Kyoto',
    prefectureKanji: '京都',
    genre: 'Vie Locale & Musique Douce',
    streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB068.stream/playlist.m3u8',
    type: 'hls',
    color: '#ef4444', // Vermilion
    isFavorite: true
  },
  {
    id: 'kazusa-fm',
    presetNumber: 4,
    name: 'Kazusa FM',
    kanji: 'かずさFM',
    frequency: '83.4 FM',
    prefecture: 'Chiba',
    prefectureKanji: '千葉',
    genre: 'Émissions Parlées & Variétés',
    streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB021.stream/playlist.m3u8',
    type: 'hls',
    color: '#3b82f6', // Blue
    isFavorite: true
  },
  {
    id: 'j1-gold',
    presetNumber: 5,
    name: 'J1 Gold Tokyo',
    kanji: 'J1ゴールド東京',
    frequency: 'CITY POP',
    prefecture: 'Tokyo',
    prefectureKanji: '東京',
    genre: 'City Pop, Showa & Heisei Classics',
    streamUrl: 'https://jenny.torontocast.com:2000/stream/J1GOLD',
    type: 'mp3',
    color: '#eab308', // Gold
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
    type: 'mp3',
    color: '#ec4899', // Pink
    isFavorite: true
  },
  {
    id: 'listen-moe',
    presetNumber: 7,
    name: 'Listen.moe JP',
    kanji: '秋葉原ラジオ',
    frequency: '24/7 HD',
    prefecture: 'Akihabara',
    prefectureKanji: '秋葉原',
    genre: 'J-Pop, Anime & Future Funk (Sans Pub)',
    streamUrl: 'https://listen.moe/stream',
    type: 'mp3',
    color: '#8b5cf6', // Violet
    isFavorite: false
  }
];

export default function App() {
  const [stations, setStations] = useState(() => {
    const saved = localStorage.getItem('kuruma_stations_v2');
    return saved ? JSON.parse(saved) : DEFAULT_STATIONS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | playing | error
  const [carMode, setCarMode] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [usingFallback, setUsingFallback] = useState(false);
  const [newStation, setNewStation] = useState({ name: '', freq: '', city: '', url: '' });

  const audioRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const currentStation = stations[currentIndex] || stations[0];

  useEffect(() => {
    localStorage.setItem('kuruma_stations_v2', JSON.stringify(stations));
  }, [stations]);

  const playStream = useCallback(async (useBackup = false) => {
    if (!audioRef.current || !currentStation) return;
    clearTimeout(reconnectTimerRef.current);

    try {
      setStatus('loading');
      const targetUrl = (useBackup && currentStation.fallbackUrl)
        ? currentStation.fallbackUrl
        : currentStation.url;

      audioRef.current.src = targetUrl;
      audioRef.current.load();
      await audioRef.current.play();
      setIsPlaying(true);
      setStatus('playing');
    } catch (err) {
      if (!useBackup && currentStation.fallbackUrl) {
        setUsingFallback(true);
        playStream(true);
      } else {
        setStatus('error');
        setIsPlaying(false);
        reconnectTimerRef.current = setTimeout(() => playStream(false), 5000);
      }
    }
  }, [currentStation]);

  const stopStream = useCallback(() => {
    clearTimeout(reconnectTimerRef.current);
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.removeAttribute('src');
    audioRef.current.load();
    setIsPlaying(false);
    setStatus('idle');
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying || status === 'loading') {
      stopStream();
    } else {
      setUsingFallback(false);
      playStream(false);
    }
  }, [isPlaying, status, stopStream, playStream]);

  const changeStation = useCallback((nextIdx) => {
    setUsingFallback(false);
    setCurrentIndex(nextIdx);
  }, []);

  const nextStation = useCallback(() => {
    changeStation((currentIndex + 1) % stations.length);
  }, [currentIndex, stations.length, changeStation]);

  const prevStation = useCallback(() => {
    changeStation((currentIndex - 1 + stations.length) % stations.length);
  }, [currentIndex, stations.length, changeStation]);

  useEffect(() => {
    if (isPlaying) {
      playStream(false);
    }
  }, [currentIndex]);

  // Synchronisation Bluetooth Autoradio & Touches Multimédias PC/Mac
  useEffect(() => {
    if ('mediaSession' in navigator && currentStation) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStation.name,
        artist: `${currentStation.jpName || currentStation.city} • ${currentStation.freq}`,
        album: 'KURUMA FM (車FM)',
        artwork: [
          { src: 'https://cdn-icons-png.flaticon.com/512/3075/3075858.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => playStream(usingFallback));
      navigator.mediaSession.setActionHandler('pause', stopStream);
      navigator.mediaSession.setActionHandler('previoustrack', prevStation);
      navigator.mediaSession.setActionHandler('nexttrack', nextStation);
    }
  }, [currentStation, playStream, stopStream, prevStation, nextStation, usingFallback]);

  const handleAddStation = (e) => {
    e.preventDefault();
    if (!newStation.name || !newStation.url) return;
    setStations([...stations, {
      id: Date.now().toString(),
      name: newStation.name,
      jpName: 'カスタム局',
      freq: newStation.freq || 'WEB',
      city: newStation.city || 'Japan',
      genre: 'Custom Stream',
      url: newStation.url,
      color: 'from-amber-500 to-orange-600'
    }]);
    setNewStation({ name: '', freq: '', city: '', url: '' });
  };

  const handleDeleteStation = (id) => {
    if (stations.length <= 1) return;
    const filtered = stations.filter(s => s.id !== id);
    setStations(filtered);
    if (currentIndex >= filtered.length) setCurrentIndex(0);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col select-none font-sans">
      <audio
        ref={audioRef}
        onWaiting={() => setStatus('loading')}
        onPlaying={() => setStatus('playing')}
        onError={() => {
          if (!usingFallback && currentStation?.fallbackUrl) {
            setUsingFallback(true);
            playStream(true);
          } else if (isPlaying) {
            setStatus('error');
            reconnectTimerRef.current = setTimeout(() => playStream(false), 5000);
          }
        }}
      />

      {/* Barre supérieure */}
      <header className="flex items-center justify-between px-5 py-4 bg-zinc-900/90 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <h1 className="text-lg font-bold tracking-wider">KURUMA FM <span className="text-zinc-500 font-normal text-sm">車FM</span></h1>
        </div>
        <button
          onClick={() => setCarMode(!carMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition ${
            carMode ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300'
          }`}
        >
          {carMode ? <><Radio size={18} /> Stations</> : <><Car size={18} /> Mode Conduite</>}
        </button>
      </header>

      {carMode ? (
        /* Mode Conduite : Gros boutons pour l'autoradio et le bureau */
        <main className="flex-1 flex flex-col justify-between p-5 max-w-2xl mx-auto w-full gap-4">
          <div className={`rounded-3xl p-6 bg-gradient-to-br ${currentStation.color} shadow-2xl flex flex-col justify-between min-h-[210px]`}>
            <div className="flex justify-between items-start">
              <span className="px-3 py-1 rounded-full bg-black/30 backdrop-blur-md text-xs font-bold tracking-widest uppercase">
                {currentStation.freq} • {currentStation.city}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/40 flex items-center gap-1.5">
                {status === 'loading' && <><RefreshCw size={14} className="animate-spin" /> Connexion...</>}
                {status === 'playing' && <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> EN DIRECT</>}
                {status === 'error' && <><AlertCircle size={14} className="text-amber-300" /> Reconnexion 5s...</>}
                {status === 'idle' && 'PRÊT'}
              </span>
            </div>

            <div className="my-4">
              <p className="text-white/80 text-sm font-medium">{currentStation.jpName}</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-0.5">{currentStation.name}</h2>
              <p className="text-white/90 text-sm mt-1">{currentStation.genre}</p>
            </div>
          </div>

          {/* Contrôles Géants */}
          <div className="grid grid-cols-3 gap-4 my-auto">
            <button
              onClick={prevStation}
              className="h-28 rounded-3xl bg-zinc-900 border border-zinc-800 active:scale-95 transition flex flex-col items-center justify-center gap-2 hover:bg-zinc-800/80"
            >
              <SkipBack size={36} />
              <span className="text-xs text-zinc-400 font-semibold uppercase">Précédent</span>
            </button>

            <button
              onClick={togglePlay}
              className={`h-28 rounded-3xl active:scale-95 transition flex flex-col items-center justify-center gap-2 shadow-xl ${
                isPlaying ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-950'
              }`}
            >
              {status === 'loading' ? (
                <RefreshCw size={42} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={42} fill="currentColor" />
              ) : (
                <Play size={42} fill="currentColor" className="ml-1" />
              )}
              <span className="text-xs font-bold uppercase">{isPlaying ? 'Stop' : 'Écouter'}</span>
            </button>

            <button
              onClick={nextStation}
              className="h-28 rounded-3xl bg-zinc-900 border border-zinc-800 active:scale-95 transition flex flex-col items-center justify-center gap-2 hover:bg-zinc-800/80"
            >
              <SkipForward size={36} />
              <span className="text-xs text-zinc-400 font-semibold uppercase">Suivant</span>
            </button>
          </div>

          {/* Accès rapide aux stations */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {stations.map((st, idx) => (
              <button
                key={st.id}
                onClick={() => {
                  changeStation(idx);
                  if (!isPlaying) setTimeout(() => playStream(false), 50);
                }}
                className={`p-3.5 rounded-2xl text-left border transition truncate ${
                  idx === currentIndex
                    ? 'bg-zinc-800 border-red-500 text-white'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <div className="text-xs font-bold text-red-400">{st.freq}</div>
                <div className="font-bold text-sm truncate mt-0.5">{st.name}</div>
              </button>
            ))}
          </div>

          {/* Barre de volume (utile sur PC/Mac) */}
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
        /* Gestionnaire de stations */
        <main className="flex-1 p-5 max-w-2xl mx-auto w-full space-y-6">
          <form onSubmit={handleAddStation} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <h3 className="font-bold text-sm text-zinc-300 flex items-center gap-2">
              <Plus size={16} /> Ajouter un flux radio
            </h3>
            <div className="grid grid-cols-2 gap-2">
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
                placeholder="Fréquence / Ville"
                value={newStation.freq}
                onChange={e => setNewStation({ ...newStation, freq: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <input
              type="url"
              placeholder="URL directe du flux (https://...)"
              value={newStation.url}
              onChange={e => setNewStation({ ...newStation, url: e.target.value })}
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
                  onClick={() => { changeStation(idx); setCarMode(true); }}
                  className="cursor-pointer flex-1 truncate pr-3"
                >
                  <div className="font-bold text-sm">{st.name} <span className="text-xs text-zinc-400">({st.freq})</span></div>
                  <div className="text-xs text-zinc-500 truncate">{st.url}</div>
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