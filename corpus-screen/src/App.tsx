import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Video,
  Monitor,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  CircleDot,
  Square,
  Pause,
  Play,
  Sparkles,
  Wand2,
  PenTool,
  MousePointer,
  Flashlight,
  ArrowUpRight,
  Trash2,
  Download,
  Image as ImageIcon,
  MonitorDown,
  Lock,
  X,
  Check,
  ArrowRight,
  Sliders,
  Film,
  BookOpen,
  Layers,
} from 'lucide-react';

import {
  type WallpaperTheme,
  type PipShape,
  type PipCorner,
  type DrawTool,
  type NormalizedPoint,
  type LaserTrailPoint,
  type DrawingStroke,
  type StudioConfig,
  type RecordedTake,
  DEFAULT_STUDIO_CONFIG,
  getResolutionDimensions,
  renderCompositorFrame,
} from './utils/studioCompositor';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function triggerConfetti() {
  try {
    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#8b5cf6', '#10b981', '#f43f5e', '#38bdf8'],
    });
  } catch {
    // ignore
  }
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function App() {
  // Studio Configuration
  const [config, setConfig] = useState<StudioConfig>(DEFAULT_STUDIO_CONFIG);
  const configRef = useRef<StudioConfig>(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Active Streams Status
  const [hasScreenStream, setHasScreenStream] = useState<boolean>(false);
  const [hasCameraStream, setHasCameraStream] = useState<boolean>(false);
  const [hasMicStream, setHasMicStream] = useState<boolean>(false);
  const [isDemoSceneActive, setIsDemoSceneActive] = useState<boolean>(true);

  // Telestrator & Laser Tools
  const [activeTool, setActiveTool] = useState<DrawTool>('laser');
  const [drawColor, setDrawColor] = useState<string>('#f43f5e');
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);

  // Recording State
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [takes, setTakes] = useState<RecordedTake[]>([]);
  const [selectedTake, setSelectedTake] = useState<RecordedTake | null>(null);
  const [rightTab, setRightTab] = useState<'scene' | 'takes'>('scene');

  // Teleprompter State
  const [showPrompter, setShowPrompter] = useState<boolean>(false);
  const [prompterText, setPrompterText] = useState<string>(
    'Merhaba! Bugün Corpus Screen Studio Pro (#004) ile hazırladığımız yeni ürün mimarisini inceleyeceğiz.\n\n1. Filigransız 4K 60 FPS ekran ve kamera kaydı.\n2. Canlı lazer imleç, spot ışığı ve ekran üzeri çizim araçları.\n3. Kayıt bittiği anda sunucuya yüklemeden doğrudan MP4/WebM indirme.'
  );

  // UI Notifications & Install Modal
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Mutable Refs for 60fps Compositor Loop & MediaStreams
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Refs synced for animation loop
  const strokesRef = useRef<DrawingStroke[]>([]);
  const laserPointsRef = useRef<LaserTrailPoint[]>([]);
  const mousePosRef = useRef<NormalizedPoint | null>(null);
  const activeToolRef = useRef<DrawTool>(activeTool);
  const hasScreenRef = useRef<boolean>(false);
  const hasCameraRef = useRef<boolean>(false);
  const isDemoRef = useRef<boolean>(true);
  const audioLevelRef = useRef<number>(0);
  const isDrawingRef = useRef<boolean>(false);
  const activeStrokeIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);
  useEffect(() => {
    hasScreenRef.current = hasScreenStream;
  }, [hasScreenStream]);
  useEffect(() => {
    hasCameraRef.current = hasCameraStream;
  }, [hasCameraStream]);
  useEffect(() => {
    isDemoRef.current = isDemoSceneActive;
  }, [isDemoSceneActive]);

  const notify = useCallback((msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  // PWA Prompt Listener
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Hidden Video Elements Setup
  useEffect(() => {
    const sv = document.createElement('video');
    sv.muted = true;
    sv.playsInline = true;
    sv.autoplay = true;
    screenVideoRef.current = sv;

    const cv = document.createElement('video');
    cv.muted = true;
    cv.playsInline = true;
    cv.autoplay = true;
    cameraVideoRef.current = cv;

    return () => {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  // Master 60fps Compositor Render Loop
  useEffect(() => {
    let rafId = 0;
    const freqData = new Uint8Array(32);

    const loop = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dims = getResolutionDimensions(configRef.current.resolution);
        if (canvas.width !== dims.width || canvas.height !== dims.height) {
          canvas.width = dims.width;
          canvas.height = dims.height;
        }

        // Sample live audio analyser level if microphone is active
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(freqData);
          let sum = 0;
          for (let i = 0; i < freqData.length; i++) sum += freqData[i];
          const avg = sum / (freqData.length * 255);
          audioLevelRef.current = avg;
          setAudioLevel(avg);
        } else {
          audioLevelRef.current = 0;
        }

        // Prune expired laser points (> 650ms)
        laserPointsRef.current = laserPointsRef.current.filter(
          (pt) => timestamp - pt.timestamp < 650
        );

        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderCompositorFrame({
            ctx,
            width: canvas.width,
            height: canvas.height,
            config: configRef.current,
            screenVideo: screenVideoRef.current,
            cameraVideo: cameraVideoRef.current,
            hasScreenStream: hasScreenRef.current,
            hasCameraStream: hasCameraRef.current,
            isDemoSceneActive: isDemoRef.current,
            strokes: strokesRef.current,
            laserPoints: laserPointsRef.current,
            mousePos: mousePosRef.current,
            activeTool: activeToolRef.current,
            audioLevel: audioLevelRef.current,
            timestamp,
          });
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Recording Timer
  useEffect(() => {
    if (recordingState !== 'recording') return;
    const interval = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [recordingState]);

  // -------------------------------------------------------------------------
  // Stream Capture Handlers (Screen, Webcam PiP, Microphone)
  // -------------------------------------------------------------------------

  const ensureAudioMixer = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const dest = ctx.createMediaStreamDestination();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      audioCtxRef.current = ctx;
      audioDestRef.current = dest;
      analyserRef.current = analyser;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return {
      ctx: audioCtxRef.current,
      dest: audioDestRef.current!,
      analyser: analyserRef.current!,
    };
  };

  const handleToggleScreenShare = async () => {
    if (hasScreenStream) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setHasScreenStream(false);
      notify('Ekran paylaşımı durduruldu.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 60, max: 60 },
          width: { ideal: 3840 },
          height: { ideal: 2160 },
        },
        audio: true,
      });

      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        await screenVideoRef.current.play().catch(() => {});
      }

      // Mix system audio if captured
      if (stream.getAudioTracks().length > 0) {
        const { ctx, dest } = ensureAudioMixer();
        const sysSource = ctx.createMediaStreamSource(stream);
        sysSource.connect(dest);
      }

      stream.getVideoTracks()[0].onended = () => {
        setHasScreenStream(false);
        screenStreamRef.current = null;
      };

      setHasScreenStream(true);
      notify('Ekran kaynağınız 60 FPS stüdyo sahnesine bağlandı!');
    } catch {
      notify('Ekran paylaşımı iptal edildi.');
    }
  };

  const handleToggleCamera = async () => {
    if (hasCameraStream) {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
      setHasCameraStream(false);
      notify('Kamera kapatıldı.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play().catch(() => {});
      }
      setHasCameraStream(true);
      setConfig((c) => ({ ...c, pipEnabled: true }));
      notify('Kamera (PiP) açıldı!');
    } catch {
      notify('Kamera erişimi sağlanamadı veya cihazda kamera bulunamadı.');
    }
  };

  const handleToggleMic = async () => {
    if (hasMicStream) {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      setHasMicStream(false);
      setAudioLevel(0);
      notify('Mikrofon kapatıldı.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;
      const { ctx, dest, analyser } = ensureAudioMixer();
      const micSource = ctx.createMediaStreamSource(stream);
      micSource.connect(analyser);
      micSource.connect(dest);
      setHasMicStream(true);
      notify('Stüdyo mikrofonu aktif edildi (Gürültü engelleme açık).');
    } catch {
      notify('Mikrofon erişimi sağlanamadı.');
    }
  };

  // -------------------------------------------------------------------------
  // Canvas Pointer Events for Laser, Spotlight & Live Telestrator Drawing
  // -------------------------------------------------------------------------

  const getNormalizedCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>): NormalizedPoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getNormalizedCanvasPos(e);
    mousePosRef.current = pt;

    if (activeTool === 'pen' || activeTool === 'rect' || activeTool === 'arrow') {
      isDrawingRef.current = true;
      const id = `stroke-${Date.now()}`;
      activeStrokeIdRef.current = id;
      const newStroke: DrawingStroke = {
        id,
        tool: activeTool,
        color: drawColor,
        lineWidth: 5,
        points: [pt],
      };
      setStrokes((prev) => [...prev, newStroke]);
    } else if (activeTool === 'laser') {
      laserPointsRef.current.push({ ...pt, timestamp: performance.now() });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getNormalizedCanvasPos(e);
    mousePosRef.current = pt;

    if (activeTool === 'laser') {
      laserPointsRef.current.push({ ...pt, timestamp: performance.now() });
    }

    if (isDrawingRef.current && activeStrokeIdRef.current) {
      const sId = activeStrokeIdRef.current;
      setStrokes((prev) =>
        prev.map((s) => (s.id === sId ? { ...s, points: [...s.points, pt] } : s))
      );
    }
  };

  const handleCanvasMouseUp = () => {
    isDrawingRef.current = false;
    activeStrokeIdRef.current = null;
  };

  // -------------------------------------------------------------------------
  // Master Video Recording Start / Pause / Stop
  // -------------------------------------------------------------------------

  const handleStartRecording = () => {
    if (!canvasRef.current) return;
    recordedChunksRef.current = [];

    const canvasStream = canvasRef.current.captureStream(config.fps);
    const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

    if (audioDestRef.current && audioDestRef.current.stream.getAudioTracks().length > 0) {
      combinedTracks.push(...audioDestRef.current.stream.getAudioTracks());
    } else if (micStreamRef.current && micStreamRef.current.getAudioTracks().length > 0) {
      combinedTracks.push(...micStreamRef.current.getAudioTracks());
    }

    const combinedStream = new MediaStream(combinedTracks);

    // Choose best supported codec (MP4 H264 or WebM VP9)
    const mimeCandidates = [
      'video/mp4;codecs=avc1',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    const selectedMime =
      mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: config.bitrateMbps * 1_000_000,
    });

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        recordedChunksRef.current.push(ev.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: selectedMime });
      const url = URL.createObjectURL(blob);
      const duration = Math.max(1, Math.round((performance.now() - startTimeRef.current) / 1000));
      const ext = selectedMime.includes('mp4') ? 'mp4' : 'webm';
      const newTake: RecordedTake = {
        id: `take-${Date.now()}`,
        name: `Corpus-Kayit-${takes.length + 1}.${ext}`,
        url,
        blob,
        mimeType: selectedMime,
        durationSec: duration,
        sizeBytes: blob.size,
        createdAt: new Date().toLocaleTimeString('tr-TR'),
        resolutionLabel: `${config.resolution.toUpperCase()} • ${config.fps} FPS`,
      };

      setTakes((prev) => [newTake, ...prev]);
      setSelectedTake(newTake);
      setRightTab('takes');
      triggerConfetti();
      notify(`Kayıt tamamlandı! (${formatDuration(duration)} • ${formatBytes(blob.size)})`);
    };

    startTimeRef.current = performance.now();
    setElapsedSec(0);
    recorder.start(250);
    mediaRecorderRef.current = recorder;
    setRecordingState('recording');
    notify('Canlı stüdyo kaydı başladı! Sahne üzerinde çizim veya lazer kullanabilirsiniz.');
  };

  const handlePauseResumeRecording = () => {
    const rec = mediaRecorderRef.current;
    if (!rec) return;
    if (rec.state === 'recording') {
      rec.pause();
      setRecordingState('paused');
      notify('Kayıt duraklatıldı.');
    } else if (rec.state === 'paused') {
      rec.resume();
      setRecordingState('recording');
      notify('Kayıt devam ediyor.');
    }
  };

  const handleStopRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
    setRecordingState('idle');
  };

  // Capture Instant 4K/HD PNG Snapshot
  const handleSnapshotPng = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Corpus-Screen-Snapshot-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerConfetti();
    notify('Anlık sahne görüntüsü (PNG) indirildi!');
  };

  // Desktop App Installer
  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallModal(false);
        triggerConfetti();
        notify('Corpus Screen Studio cihazınıza kuruldu!');
        return;
      }
    }
    setShowInstallModal(true);
  };

  const handleDownloadDesktopLauncher = () => {
    const appUrl = window.location.origin;
    const batContent = `@echo off
title Corpus Screen Studio Pro (#004)
start "" msedge --app="${appUrl}" 2>nul || start "" chrome --app="${appUrl}" 2>nul || start "" "${appUrl}"
exit
`;
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Screen-Studio-Masaustu-Uygulamasi.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerConfetti();
    notify('Masaüstü başlatıcısı (.bat) indirildi!');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col justify-between relative selection:bg-violet-500/30 corpus-grid-bg">
      {/* Ambient Top Glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[380px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.16), rgba(16, 185, 129, 0.04), transparent)',
        }}
      />

      {/* Toast Notification */}
      {statusToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md rounded-xl bg-zinc-900/95 border border-violet-500/40 px-4 py-3 shadow-2xl backdrop-blur-xl flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="text-xs font-medium text-zinc-100">{statusToast}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* CORPUS UNIFIED HEADER (#004)                                        */}
      {/* =================================================================== */}
      <header className="relative z-20 border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/25 via-violet-500/10 to-zinc-900 border border-violet-500/40 flex items-center justify-center shadow-[0_0_20px_-4px_rgba(139,92,246,0.45)]">
              <Video className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-zinc-100 text-sm sm:text-base">
                Corpus
              </span>
              <span className="text-zinc-600 font-light">/</span>
              <span className="font-medium text-zinc-300 text-sm sm:text-base">Screen Studio</span>
            </div>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-zinc-900 text-violet-300 border border-violet-500/30">
              #004 PRO
            </span>
          </div>

          {/* Center Recording Status & Teleprompter Toggle */}
          <div className="flex items-center gap-2">
            {recordingState !== 'idle' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono text-xs font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>
                  {recordingState === 'paused' ? 'DURAKLATILDI' : 'CANLI KAYIT'} •{' '}
                  {formatDuration(elapsedSec)}
                </span>
              </div>
            )}

            <button
              onClick={() => setShowPrompter((p) => !p)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                showPrompter
                  ? 'bg-violet-600 text-white border-violet-500'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Suflör (Teleprompter)</span>
            </button>
          </div>

          {/* Right Security Badge + Install Desktop App */}
          <div className="flex items-center gap-2.5">
            <div className="hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800/90 text-xs text-zinc-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Lock className="w-3 h-3 text-violet-400" />
              <span className="font-medium text-[11px]">4K 60FPS • %0 Filigran • Yerel Kayıt</span>
            </div>

            <button
              onClick={handleTriggerInstall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-medium transition-all cursor-pointer"
            >
              <MonitorDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Uygulamayı İndir</span>
            </button>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* MAIN 12-COLUMN BROADCAST & RECORDING WORKSPACE                      */}
      {/* =================================================================== */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 flex flex-col">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* --------------------------------------------------------------- */}
          {/* LEFT 8 COLS: LIVE COMPOSITOR STAGE, TELESTRATOR & RECORD DECK   */}
          {/* --------------------------------------------------------------- */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Top Source & Telestrator Toolbar */}
            <div className="rounded-2xl bg-[#111114]/95 border border-zinc-800/90 p-3 corpus-card-glow flex flex-wrap items-center justify-between gap-2">
              {/* Source Input Toggles */}
              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  onClick={handleToggleScreenShare}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    hasScreenStream
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-violet-600 hover:bg-violet-500 text-white border-violet-500 shadow-[0_0_15px_-3px_rgba(139,92,246,0.6)]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>{hasScreenStream ? 'Ekran Paylaşılıyor' : 'Ekran Seç & Paylaş'}</span>
                </button>

                <button
                  onClick={handleToggleCamera}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    hasCameraStream
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                  }`}
                >
                  {hasCameraStream ? (
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <CameraOff className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span>{hasCameraStream ? 'Kamera Açık' : 'Kamera (PiP)'}</span>
                </button>

                <button
                  onClick={handleToggleMic}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    hasMicStream
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                  }`}
                >
                  {hasMicStream ? (
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span>{hasMicStream ? 'Mikrofon Açık' : 'Mikrofon'}</span>
                </button>
              </div>

              {/* Live Telestrator & Laser Pointer Tools */}
              <div className="flex items-center flex-wrap gap-1">
                {(
                  [
                    { id: 'laser', label: 'Lazer', icon: Wand2 },
                    { id: 'spotlight', label: 'Spot Işığı', icon: Flashlight },
                    { id: 'pen', label: 'Kalem', icon: PenTool },
                    { id: 'arrow', label: 'Ok Çiz', icon: ArrowUpRight },
                    { id: 'rect', label: 'Kutu', icon: Square },
                    { id: 'cursor', label: 'Normal', icon: MousePointer },
                  ] as const
                ).map((t) => {
                  const Icon = t.icon;
                  const active = activeTool === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTool(t.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-violet-600 text-white'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.label}</span>
                    </button>
                  );
                })}

                {strokes.length > 0 && (
                  <button
                    onClick={() => setStrokes([])}
                    className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 cursor-pointer"
                    title="Ekrandaki Çizimleri Temizle"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Center 16:9 Live Compositor Canvas Viewport */}
            <div className="relative rounded-2xl bg-[#0d0d11] border border-zinc-800/90 corpus-card-glow overflow-hidden aspect-video flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className="w-full h-full object-contain cursor-crosshair block"
              />

              {/* Floating Teleprompter Overlay (Invisible in recorded video!) */}
              {showPrompter && (
                <div className="absolute top-4 inset-x-12 z-20 rounded-2xl bg-black/80 backdrop-blur-md border border-violet-500/40 p-4 shadow-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-violet-300">
                      Canlı Suflör (Sadece Size Görünür — Videoda Çıkmaz)
                    </span>
                    <button
                      onClick={() => setShowPrompter(false)}
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={prompterText}
                    onChange={(e) => setPrompterText(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent text-sm sm:text-base font-medium text-zinc-100 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* Bottom Master Recording Deck */}
            <div className="rounded-2xl bg-[#111114]/95 border border-zinc-800/90 px-5 py-4 corpus-card-glow flex flex-wrap items-center justify-between gap-4">
              {/* Left Audio Meter & Color Swatches */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Çizim Rengi:</span>
                  {['#f43f5e', '#10b981', '#8b5cf6', '#facc15', '#38bdf8'].map((col) => (
                    <button
                      key={col}
                      onClick={() => setDrawColor(col)}
                      className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                        drawColor === col ? 'scale-125 border-white' : 'border-zinc-700 opacity-80'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>

                {/* Live VU Meter */}
                <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-zinc-800">
                  <Mic className="w-3.5 h-3.5 text-zinc-400" />
                  <div className="w-24 h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-violet-400 to-rose-500 transition-all duration-75"
                      style={{ width: `${Math.min(100, Math.round(audioLevel * 220))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Recording Controls */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSnapshotPng}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium cursor-pointer"
                  title="Anlık 4K/HD Kare Yakala (PNG)"
                >
                  <ImageIcon className="w-4 h-4 text-violet-400" />
                  <span>Kare Yakala (PNG)</span>
                </button>

                {recordingState === 'idle' ? (
                  <button
                    onClick={handleStartRecording}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white font-semibold text-xs sm:text-sm shadow-[0_0_25px_-4px_rgba(244,63,94,0.7)] transition-all cursor-pointer"
                  >
                    <CircleDot className="w-4 h-4 animate-pulse" />
                    <span>Kaydı Başlat ({config.fps} FPS)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePauseResumeRecording}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold cursor-pointer"
                    >
                      {recordingState === 'paused' ? (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Devam Et</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Duraklat</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleStopRecording}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold shadow-lg cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Kaydı Bitir & İndir ({formatDuration(elapsedSec)})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* RIGHT 4 COLS: SCREENSTUDIO SCENE CUSTOMIZER & TAKES LIBRARY     */}
          {/* --------------------------------------------------------------- */}
          <div className="lg:col-span-4 rounded-2xl bg-[#111114]/95 border border-zinc-800/90 corpus-card-glow flex flex-col overflow-hidden">
            {/* Inspector Tabs */}
            <div className="grid grid-cols-2 border-b border-zinc-800 bg-zinc-900/60">
              <button
                onClick={() => setRightTab('scene')}
                className={`py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  rightTab === 'scene'
                    ? 'border-violet-500 text-zinc-100 bg-violet-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-violet-400" />
                <span>Sahne & Kamera</span>
              </button>

              <button
                onClick={() => setRightTab('takes')}
                className={`py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  rightTab === 'takes'
                    ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kayıtlarım ({takes.length})</span>
              </button>
            </div>

            {rightTab === 'scene' ? (
              /* SCENE & CAMERA INSPECTOR */
              <div className="p-4 space-y-5 overflow-y-auto max-h-[640px] text-xs">
                {/* 1. Resolution & FPS */}
                <div className="space-y-2">
                  <label className="block font-mono text-[11px] uppercase text-zinc-400">
                    Çözünürlük & Kare Hızı
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1080p', '4k', '720p'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setConfig((c) => ({ ...c, resolution: res }))}
                        className={`py-2 rounded-xl font-mono text-xs border cursor-pointer ${
                          config.resolution === res
                            ? 'bg-violet-600 text-white border-violet-500'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {res.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. ScreenStudio Wallpaper Theme */}
                <div className="space-y-2">
                  <label className="block font-mono text-[11px] uppercase text-zinc-400">
                    ScreenStudio Arka Plan Çerçevesi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'corpus-violet', label: 'Corpus Violet' },
                        { id: 'emerald-matrix', label: 'Emerald Matrix' },
                        { id: 'sunset-glow', label: 'Sunset Glow' },
                        { id: 'midnight-slate', label: 'Midnight Slate' },
                        { id: 'none', label: 'Çerçevesiz (Tam Ekran)' },
                      ] as const
                    ).map((wp) => (
                      <button
                        key={wp.id}
                        onClick={() =>
                          setConfig((c) => ({ ...c, wallpaper: wp.id as WallpaperTheme }))
                        }
                        className={`py-2 px-2.5 rounded-xl text-left font-medium border truncate cursor-pointer ${
                          config.wallpaper === wp.id
                            ? 'bg-violet-500/20 text-violet-200 border-violet-500'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {wp.label}
                      </button>
                    ))}
                  </div>

                  {config.wallpaper !== 'none' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="text-[11px] text-zinc-400 block mb-1">
                          Çerçeve Boşluğu ({config.padding}px)
                        </span>
                        <input
                          type="range"
                          min={16}
                          max={84}
                          value={config.padding}
                          onChange={(e) =>
                            setConfig((c) => ({ ...c, padding: Number(e.target.value) }))
                          }
                          className="w-full accent-violet-500"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-400 block mb-1">
                          Köşe Yuvarlaklığı ({config.cornerRadius}px)
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={36}
                          value={config.cornerRadius}
                          onChange={(e) =>
                            setConfig((c) => ({ ...c, cornerRadius: Number(e.target.value) }))
                          }
                          className="w-full accent-violet-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Webcam PiP Settings */}
                <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase text-zinc-400">
                      Kamera (PiP) Balonu
                    </span>
                    <input
                      type="checkbox"
                      checked={config.pipEnabled}
                      onChange={(e) =>
                        setConfig((c) => ({ ...c, pipEnabled: e.target.checked }))
                      }
                      className="accent-violet-500"
                    />
                  </div>

                  {config.pipEnabled && (
                    <>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            { id: 'circle', label: 'Yuvarlak' },
                            { id: 'rounded', label: 'Geniş Kare' },
                            { id: 'portrait', label: 'Portre' },
                          ] as const
                        ).map((sh) => (
                          <button
                            key={sh.id}
                            onClick={() =>
                              setConfig((c) => ({ ...c, pipShape: sh.id as PipShape }))
                            }
                            className={`py-1.5 rounded-lg border cursor-pointer ${
                              config.pipShape === sh.id
                                ? 'bg-violet-600 text-white border-violet-500'
                                : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                            }`}
                          >
                            {sh.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {(
                          [
                            { id: 'bottom-left', label: 'Sol Alt' },
                            { id: 'bottom-right', label: 'Sağ Alt' },
                            { id: 'top-left', label: 'Sol Üst' },
                            { id: 'top-right', label: 'Sağ Üst' },
                          ] as const
                        ).map((pos) => (
                          <button
                            key={pos.id}
                            onClick={() =>
                              setConfig((c) => ({ ...c, pipCorner: pos.id as PipCorner }))
                            }
                            className={`py-1.5 rounded-lg border text-[11px] cursor-pointer ${
                              config.pipCorner === pos.id
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>

                      <div>
                        <span className="text-[11px] text-zinc-400 block mb-1">
                          Kamera Boyutu (%{Math.round(config.pipSize * 100)})
                        </span>
                        <input
                          type="range"
                          min={0.14}
                          max={0.32}
                          step={0.02}
                          value={config.pipSize}
                          onChange={(e) =>
                            setConfig((c) => ({ ...c, pipSize: Number(e.target.value) }))
                          }
                          className="w-full accent-violet-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* 4. Lower-Third Speaker Banner */}
                <div className="space-y-2.5 pt-3 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase text-zinc-400">
                      Alt Bant (İsim & Sunum Başlığı)
                    </span>
                    <input
                      type="checkbox"
                      checked={config.lowerThirdEnabled}
                      onChange={(e) =>
                        setConfig((c) => ({ ...c, lowerThirdEnabled: e.target.checked }))
                      }
                      className="accent-violet-500"
                    />
                  </div>

                  {config.lowerThirdEnabled && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={config.lowerThirdTitle}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, lowerThirdTitle: e.target.value }))
                        }
                        placeholder="Konuşmacı / Başlık"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100"
                      />
                      <input
                        type="text"
                        value={config.lowerThirdSubtitle}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, lowerThirdSubtitle: e.target.value }))
                        }
                        placeholder="Alt Başlık"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100"
                      />
                    </div>
                  )}
                </div>

                {/* 5. Demo Scene Toggle */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-zinc-400">Canlı Demo Sahne Simülasyonu</span>
                  <button
                    onClick={() => setIsDemoSceneActive((d) => !d)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      isDemoSceneActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {isDemoSceneActive ? 'Aktif' : 'Kapalı'}
                  </button>
                </div>
              </div>
            ) : (
              /* RECORDED TAKES LIBRARY & VIDEO PLAYER */
              <div className="p-4 flex-1 flex flex-col space-y-4 overflow-y-auto max-h-[640px]">
                {takes.length === 0 ? (
                  <div className="my-auto text-center py-12 space-y-2 text-zinc-500 text-xs">
                    <Layers className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="font-medium text-zinc-300">Henüz video kaydı alınmadı</p>
                    <p>
                      Sol alttaki "Kaydı Başlat" butonuna tıklayarak filigransız 60 FPS video
                      kaydetmeye başlayabilirsiniz.
                    </p>
                  </div>
                ) : (
                  <>
                    {selectedTake && (
                      <div className="space-y-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                        <video
                          src={selectedTake.url}
                          controls
                          className="w-full rounded-lg aspect-video bg-black"
                        />
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-zinc-100">{selectedTake.name}</p>
                            <p className="font-mono text-[11px] text-zinc-400">
                              {formatDuration(selectedTake.durationSec)} •{' '}
                              {formatBytes(selectedTake.sizeBytes)} •{' '}
                              {selectedTake.resolutionLabel}
                            </p>
                          </div>
                          <a
                            href={selectedTake.url}
                            download={selectedTake.name}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>İndir</span>
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {takes.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTake(t)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                            selectedTake?.id === t.id
                              ? 'bg-violet-500/15 border-violet-500/50'
                              : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-zinc-100 truncate">{t.name}</p>
                            <p className="text-[11px] font-mono text-zinc-400">
                              {t.createdAt} • {formatDuration(t.durationSec)} •{' '}
                              {formatBytes(t.sizeBytes)}
                            </p>
                          </div>
                          <a
                            href={t.url}
                            download={t.name}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400"
                            title="Videoyu İndir"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* =================================================================== */}
      {/* DESKTOP & MOBILE APP INSTALLER MODAL                                */}
      {/* =================================================================== */}
      {showInstallModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowInstallModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#121216] border border-zinc-800 p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <MonitorDown className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Corpus Screen Studio Masaüstü Kurulumu
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    OBS / ScreenStudio / Loom Masaüstü Deneyimi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Tek Tıkla Masaüstü Başlatıcısı (.bat) İndir</span>
                </p>
                <p className="text-zinc-400">
                  Bağımsız masaüstü uygulaması penceresinde açmak için başlatıcıyı indirin:
                </p>
                <button
                  onClick={handleDownloadDesktopLauncher}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Corpus Screen Studio Masaüstü Uygulamasını İndir (.bat)</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <p className="font-semibold text-violet-300 flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4" />
                  <span>Tarayıcıdan PWA Olarak Sabitle</span>
                </p>
                <p className="text-zinc-400">
                  Adres çubuğunun sağındaki uygulama yükleme simgesine tıklayarak cihazınıza kalıcı
                  olarak kurabilirsiniz.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CORPUS UNIFIED FOOTER (#004)                                        */}
      {/* =================================================================== */}
      <footer className="relative z-10 border-t border-zinc-900/90 py-4 px-4 sm:px-6 text-center">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">Corpus Platform</span>
            <span>•</span>
            <span>Site #004 of 100 — Corpus Screen & Video Studio Pro</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            4K 60FPS Compositor • Webcam PiP • Live Laser & Telestrator • Zero Watermark
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
