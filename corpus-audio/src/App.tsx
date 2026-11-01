import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  AudioWaveform,
  UploadCloud,
  Play,
  Pause,
  Square,
  Scissors,
  Mic,
  Sparkles,
  Sliders,
  Download,
  MonitorDown,
  Lock,
  Check,
  X,
  ArrowRight,
  RotateCcw,
  Music,
  Radio,
  Gauge,
} from 'lucide-react';

import {
  type VocalMode,
  type AudioDspSettings,
  EQ_FREQUENCIES,
  EQ_PRESETS,
  createDefaultDspSettings,
  decodeMediaFileToAudioBuffer,
  createDemoStudioAudioBuffer,
  processVocalModeBuffer,
  connectDspChain,
  exportMasteredWavBlob,
} from './utils/audioDspEngine';

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
      colors: ['#8b5cf6', '#10b981', '#a78bfa', '#34d399'],
    });
  } catch {
    // ignore
  }
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00.0';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
}

export function App() {
  // Audio Buffer & File Metadata
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [trackName, setTrackName] = useState<string>('Corpus-Demo-Synth-Vokal.wav');
  const [settings, setSettings] = useState<AudioDspSettings>(() => createDefaultDspSettings(16));

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // PWA / Desktop Installer
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Web Audio Live Graph Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const playStartWallTimeRef = useRef<number>(0);
  const playStartOffsetRef = useRef<number>(0);

  // Canvases for Waveform & FFT Spectrum
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const micChunksRef = useRef<Blob[]>([]);

  const notify = useCallback((msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Load Built-in Stereo Synth + Vocal Demo Track on initial mount
  useEffect(() => {
    const demoBuf = createDemoStudioAudioBuffer();
    setAudioBuffer(demoBuf);
    setSettings(createDefaultDspSettings(demoBuf.duration));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Stop active playback helper
  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Start Live Web Audio Playback from offset
  const startPlayback = useCallback(
    (startOffsetSec?: number) => {
      if (!audioBuffer) return;
      stopPlayback();

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const processedBuf = processVocalModeBuffer(audioBuffer, settings.vocalMode, ctx);
      const src = ctx.createBufferSource();
      src.buffer = processedBuf;
      src.playbackRate.value = settings.playbackRate;
      src.detune.value = settings.detuneSemitones * 100;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const filters = connectDspChain(ctx, src, settings, analyser);
      analyser.connect(ctx.destination);
      eqNodesRef.current = filters;

      const offset =
        startOffsetSec !== undefined
          ? Math.max(settings.trimStartSec, Math.min(settings.trimEndSec - 0.1, startOffsetSec))
          : settings.trimStartSec;

      const playDuration = Math.max(0.1, settings.trimEndSec - offset);

      playStartWallTimeRef.current = performance.now();
      playStartOffsetRef.current = offset;

      src.onended = () => {
        setIsPlaying(false);
        setCurrentTime(settings.trimStartSec);
      };

      src.start(0, offset, playDuration);
      sourceNodeRef.current = src;
      setIsPlaying(true);
    },
    [audioBuffer, settings, stopPlayback]
  );

  // Live update EQ gains, speed & pitch while playing without stopping
  useEffect(() => {
    eqNodesRef.current.forEach((node, idx) => {
      node.gain.value = settings.eqGains[idx] || 0;
    });
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = settings.playbackRate;
      sourceNodeRef.current.detune.value = settings.detuneSemitones * 100;
    }
  }, [settings.eqGains, settings.playbackRate, settings.detuneSemitones]);

  // Draw Waveform + Trim Handles + Playhead + 60fps FFT Spectrum
  useEffect(() => {
    let rafId = 0;
    const freqData = new Uint8Array(64);

    const renderVisuals = () => {
      // Update playhead time if playing
      let activePlayhead = currentTime;
      if (isPlaying) {
        const elapsedSec =
          ((performance.now() - playStartWallTimeRef.current) / 1000) * settings.playbackRate;
        activePlayhead = Math.min(
          settings.trimEndSec,
          playStartOffsetRef.current + elapsedSec
        );
        setCurrentTime(activePlayhead);
      }

      // 1. Render Waveform Canvas
      const wfCanvas = waveformCanvasRef.current;
      if (wfCanvas && audioBuffer) {
        const w = wfCanvas.width;
        const h = wfCanvas.height;
        const ctx = wfCanvas.getContext('2d')!;
        ctx.fillStyle = '#0b0b0f';
        ctx.fillRect(0, 0, w, h);

        const data = audioBuffer.getChannelData(0);
        const step = Math.max(1, Math.floor(data.length / w));
        const midY = h / 2;

        const trimStartRatio = settings.trimStartSec / audioBuffer.duration;
        const trimEndRatio = settings.trimEndSec / audioBuffer.duration;
        const trimStartX = trimStartRatio * w;
        const trimEndX = trimEndRatio * w;

        // Highlight active trim zone
        ctx.fillStyle = 'rgba(139, 92, 246, 0.09)';
        ctx.fillRect(trimStartX, 0, Math.max(2, trimEndX - trimStartX), h);

        // Draw waveform bars
        for (let x = 0; x < w; x += 3) {
          const sampleIdx = Math.min(data.length - 1, x * step);
          let maxPeak = 0;
          for (let j = 0; j < step; j += 16) {
            const v = Math.abs(data[sampleIdx + j] || 0);
            if (v > maxPeak) maxPeak = v;
          }
          const barH = Math.max(3, maxPeak * (h * 0.84));
          const inTrim = x >= trimStartX && x <= trimEndX;
          const isPlayed = x <= (activePlayhead / audioBuffer.duration) * w;

          ctx.fillStyle = !inTrim
            ? '#27272a'
            : isPlayed
            ? '#10b981'
            : '#8b5cf6';
          ctx.fillRect(x, midY - barH / 2, 2, barH);
        }

        // Trim Handles
        ctx.fillStyle = '#a78bfa';
        ctx.fillRect(trimStartX, 0, 3, h);
        ctx.fillRect(trimEndX - 3, 0, 3, h);

        // Playhead Line
        const playheadX = (activePlayhead / audioBuffer.duration) * w;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(playheadX, 0, 2, h);
      }

      // 2. Render Live FFT Frequency Spectrum Canvas
      const spCanvas = spectrumCanvasRef.current;
      if (spCanvas) {
        const w = spCanvas.width;
        const h = spCanvas.height;
        const ctx = spCanvas.getContext('2d')!;
        ctx.fillStyle = '#0b0b0f';
        ctx.fillRect(0, 0, w, h);

        if (isPlaying && analyserRef.current) {
          analyserRef.current.getByteFrequencyData(freqData);
        } else {
          freqData.fill(6);
        }

        const barCount = 40;
        const barW = w / barCount;
        for (let i = 0; i < barCount; i++) {
          const val = freqData[i] / 255;
          const bh = Math.max(3, val * (h - 8));
          const grad = ctx.createLinearGradient(0, h, 0, 0);
          grad.addColorStop(0, '#8b5cf6');
          grad.addColorStop(1, '#10b981');
          ctx.fillStyle = grad;
          ctx.fillRect(i * barW + 2, h - bh, barW - 4, bh);
        }
      }

      rafId = requestAnimationFrame(renderVisuals);
    };

    rafId = requestAnimationFrame(renderVisuals);
    return () => cancelAnimationFrame(rafId);
  }, [audioBuffer, currentTime, isPlaying, settings]);

  // -------------------------------------------------------------------------
  // Upload Audio or Video (MP4 / WebM -> Audio Extraction!)
  // -------------------------------------------------------------------------

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    stopPlayback();
    notify(`"${file.name}" ses kanalları çözülüyor...`);
    try {
      const decoded = await decodeMediaFileToAudioBuffer(file);
      setAudioBuffer(decoded);
      setTrackName(file.name);
      setSettings(createDefaultDspSettings(decoded.duration));
      setCurrentTime(0);
      notify(
        `${file.name} yüklendi (${decoded.duration.toFixed(1)} sn • ${decoded.sampleRate} Hz).`
      );
    } catch {
      notify('Dosyadan ses çözümlenemedi. Lütfen geçerli bir ses veya video dosyası seçin.');
    }
  };

  // Microphone Podcast Recorder
  const handleToggleMicRecord = async () => {
    if (isRecordingMic) {
      micRecorderRef.current?.stop();
      setIsRecordingMic(false);
      return;
    }

    try {
      stopPlayback();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micChunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) micChunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(micChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `Podcast-Mikrofon-Kaydi.webm`, { type: 'audio/webm' });
        await handleFileUpload(file);
      };
      rec.start();
      micRecorderRef.current = rec;
      setIsRecordingMic(true);
      notify('Mikrofon kaydı başladı! Bitirmek için tekrar tıklayın.');
    } catch {
      notify('Mikrofon erişimi sağlanamadı.');
    }
  };

  // Export Mastered WAV
  const handleExportWav = async () => {
    if (!audioBuffer) return;
    setIsExporting(true);
    try {
      const wavBlob = await exportMasteredWavBlob(audioBuffer, settings);
      const url = URL.createObjectURL(wavBlob);
      const outName = trackName.replace(/\.[^.]+$/, '') + `-${settings.vocalMode}-mastered.wav`;
      const a = document.createElement('a');
      a.href = url;
      a.download = outName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      triggerConfetti();
      notify(`${outName} kayıpsız stüdyo WAV olarak indirildi!`);
    } finally {
      setIsExporting(false);
    }
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
        notify('Corpus Audio Studio cihazınıza kuruldu!');
        return;
      }
    }
    setShowInstallModal(true);
  };

  const handleDownloadDesktopLauncher = () => {
    const appUrl = window.location.origin;
    const batContent = `@echo off
title Corpus Audio & Vocal Studio Pro (#006)
start "" msedge --app="${appUrl}" 2>nul || start "" chrome --app="${appUrl}" 2>nul || start "" "${appUrl}"
exit
`;
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Audio-Studio-Masaustu-Uygulamasi.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerConfetti();
    notify('Masaüstü başlatıcısı (.bat) indirildi!');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col justify-between relative selection:bg-violet-500/30 corpus-grid-bg">
      {/* Top Ambient Glow */}
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
      {/* CORPUS UNIFIED HEADER (#006)                                        */}
      {/* =================================================================== */}
      <header className="relative z-20 border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/25 via-violet-500/10 to-zinc-900 border border-violet-500/40 flex items-center justify-center shadow-[0_0_20px_-4px_rgba(139,92,246,0.45)]">
              <AudioWaveform className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-zinc-100 text-sm sm:text-base">
                Corpus
              </span>
              <span className="text-zinc-600 font-light">/</span>
              <span className="font-medium text-zinc-300 text-sm sm:text-base">
                Audio & Vocal Studio
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-zinc-900 text-violet-300 border border-violet-500/30">
              #006 PRO
            </span>
          </div>

          {/* Center File Upload, Mic Record & Demo Track */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*,.mp3,.wav,.flac,.m4a,.ogg,.mp4,.webm,.mov"
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium shadow cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Ses veya Video (MP4) Yükle</span>
            </button>

            <button
              onClick={handleToggleMicRecord}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                isRecordingMic
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">
                {isRecordingMic ? 'Kaydı Bitir' : 'Mikrofon Kaydet'}
              </span>
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
              <span className="font-medium text-[11px]">WebAudio DSP • Kayıpsız WAV Çıktı</span>
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
      {/* MAIN AUDIO MASTERING & VOCAL SEPARATOR WORKSPACE                    */}
      {/* =================================================================== */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* ----------------------------------------------------------------- */}
        {/* TOP DECK: WAVEFORM TRIMMER, FFT SPECTRUM & TRANSPORT CONTROLS     */}
        {/* ----------------------------------------------------------------- */}
        <div className="rounded-2xl bg-[#111114]/95 border border-zinc-800/90 p-5 corpus-card-glow space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 font-mono text-xs">
                {trackName}
              </div>
              {audioBuffer && (
                <span className="text-xs font-mono text-zinc-400">
                  {audioBuffer.sampleRate} Hz • Stereo • {formatTime(audioBuffer.duration)}
                </span>
              )}
            </div>

            {/* Live FFT Spectrum Mini Monitor */}
            <canvas
              ref={spectrumCanvasRef}
              width={260}
              height={38}
              className="rounded-lg border border-zinc-800 bg-[#0b0b0f]"
            />
          </div>

          {/* Interactive Waveform Canvas (Click to Seek) */}
          <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-[#0b0b0f]">
            <canvas
              ref={waveformCanvasRef}
              width={1200}
              height={150}
              onClick={(e) => {
                if (!audioBuffer) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const seekTime = ratio * audioBuffer.duration;
                setCurrentTime(seekTime);
                if (isPlaying) {
                  startPlayback(seekTime);
                }
              }}
              className="w-full h-[150px] block cursor-pointer"
            />
          </div>

          {/* Trim Range Sliders & Transport Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-1">
            {/* Transport Buttons */}
            <div className="lg:col-span-5 flex items-center gap-2.5">
              {!isPlaying ? (
                <button
                  onClick={() => startPlayback(currentTime)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-[0_0_20px_-4px_rgba(139,92,246,0.7)] cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Oynat</span>
                </button>
              ) : (
                <button
                  onClick={stopPlayback}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Duraklat</span>
                </button>
              )}

              <button
                onClick={() => {
                  stopPlayback();
                  setCurrentTime(settings.trimStartSec);
                }}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 cursor-pointer"
                title="Başa Sar"
              >
                <Square className="w-4 h-4" />
              </button>

              <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-400">
                {formatTime(currentTime)} / {formatTime(settings.trimEndSec)}
              </div>
            </div>

            {/* Trim Start / End Controls */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 mb-1">
                  <Scissors className="w-3 h-3 text-violet-400" />
                  BAŞLANGIÇ ({settings.trimStartSec.toFixed(1)}s)
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0.1, settings.trimEndSec - 0.5)}
                  step={0.1}
                  value={settings.trimStartSec}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, trimStartSec: Number(e.target.value) }))
                  }
                  className="w-full accent-violet-500"
                />
              </div>

              <div>
                <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 mb-1">
                  <Scissors className="w-3 h-3 text-emerald-400" />
                  BİTİŞ ({settings.trimEndSec.toFixed(1)}s)
                </span>
                <input
                  type="range"
                  min={settings.trimStartSec + 0.5}
                  max={audioBuffer?.duration || 16}
                  step={0.1}
                  value={settings.trimEndSec}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, trimEndSec: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <span className="text-[11px] font-mono text-zinc-400 block mb-1">
                  FADE-IN ({settings.fadeInSec}s)
                </span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={settings.fadeInSec}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, fadeInSec: Number(e.target.value) }))
                  }
                  className="w-full accent-violet-500"
                />
              </div>

              <div>
                <span className="text-[11px] font-mono text-zinc-400 block mb-1">
                  FADE-OUT ({settings.fadeOutSec}s)
                </span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={settings.fadeOutSec}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, fadeOutSec: Number(e.target.value) }))
                  }
                  className="w-full accent-violet-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* BOTTOM SPLIT: LEFT VOCAL SEPARATOR & PITCH + RIGHT 10-BAND EQ     */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 5 Cols: Moises Vocal/Instrumental Separator & Pitch/Speed */}
          <div className="lg:col-span-5 rounded-2xl bg-[#111114]/95 border border-zinc-800/90 p-5 corpus-card-glow flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Music className="w-4 h-4 text-violet-400" />
                  <span>Moises / VocalRemover — Vokal & Enstrüman Ayırıcı</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    {
                      id: 'normal',
                      title: 'Orijinal Stereo Mix',
                      desc: 'Vokal + Enstrüman Dengeli',
                    },
                    {
                      id: 'karaoke',
                      title: 'Karaoke (Vokali Sil)',
                      desc: 'Merkez vokali siler, bas ve müziği korur',
                    },
                    {
                      id: 'vocal-only',
                      title: 'Acappella (Vokal Odak)',
                      desc: 'Merkez vokali izole eder, yan sesleri kısar',
                    },
                    {
                      id: 'podcast-clean',
                      title: 'Adobe Podcast Temizleyici',
                      desc: 'Dip gürültüyü keser, konuşmayı parlatır',
                    },
                  ] as const
                ).map((m) => {
                  const active = settings.vocalMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        const nextMode = m.id as VocalMode;
                        setSettings((s) => ({ ...s, vocalMode: nextMode }));
                        if (isPlaying) {
                          setTimeout(() => startPlayback(currentTime), 20);
                        }
                        notify(`Mod değiştirildi: ${m.title}`);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-violet-600/20 border-violet-500 text-violet-100 shadow'
                          : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <p className="text-xs font-semibold">{m.title}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pitch, Tempo & Master Gain Controls */}
            <div className="space-y-3 pt-3 border-t border-zinc-800/80 text-xs">
              <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>Hız (Tempo), Ton (Pitch) & Kompresör</span>
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex justify-between font-mono text-[11px] text-zinc-400 mb-1">
                    <span>HIZ</span>
                    <span className="text-violet-300">{settings.playbackRate.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={1.75}
                    step={0.05}
                    value={settings.playbackRate}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, playbackRate: Number(e.target.value) }))
                    }
                    className="w-full accent-violet-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex justify-between font-mono text-[11px] text-zinc-400 mb-1">
                    <span>TON (PITCH)</span>
                    <span className="text-emerald-300">
                      {settings.detuneSemitones > 0
                        ? `+${settings.detuneSemitones}`
                        : settings.detuneSemitones}{' '}
                      st
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={settings.detuneSemitones}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, detuneSemitones: Number(e.target.value) }))
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex justify-between font-mono text-[11px] text-zinc-400 mb-1">
                    <span>SES GÜCÜ</span>
                    <span className="text-amber-300">
                      %{Math.round(settings.masterGain * 100)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={2.0}
                    step={0.1}
                    value={settings.masterGain}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, masterGain: Number(e.target.value) }))
                    }
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Export Mastered WAV CTA */}
            <button
              onClick={handleExportWav}
              disabled={isExporting || !audioBuffer}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_-4px_rgba(16,185,129,0.65)] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {isExporting
                  ? 'Stüdyo Mastering İşleniyor...'
                  : 'İşlenmiş Sesi İndir (Kayıpsız Stüdyo WAV)'}
              </span>
            </button>
          </div>

          {/* Right 7 Cols: 10-Band Mastering Graphic Equalizer */}
          <div className="lg:col-span-7 rounded-2xl bg-[#111114]/95 border border-zinc-800/90 p-5 corpus-card-glow flex flex-col justify-between space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  10-Bant Mastering Grafik Ekolayzır (-12 dB .. +12 dB)
                </h3>
              </div>

              <div className="flex items-center flex-wrap gap-1.5">
                {Object.entries(EQ_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSettings((s) => ({ ...s, eqGains: [...preset.gains] }));
                      notify(`EQ Profili uygulandı: ${preset.label}`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                      playbackRate: 1.0,
                      detuneSemitones: 0,
                    }))
                  }
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 cursor-pointer"
                  title="Sıfırla"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 10 Vertical EQ Faders */}
            <div className="grid grid-cols-10 gap-2 py-4 px-3 rounded-xl bg-zinc-950/90 border border-zinc-800/90">
              {EQ_FREQUENCIES.map((freq, idx) => {
                const gain = settings.eqGains[idx] || 0;
                const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
                return (
                  <div key={freq} className="flex flex-col items-center gap-2">
                    <span className="font-mono text-[10px] text-violet-300">
                      {gain > 0 ? `+${gain}` : gain}dB
                    </span>

                    <div className="h-40 flex items-center justify-center">
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={1}
                        value={gain}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSettings((s) => {
                            const next = [...s.eqGains];
                            next[idx] = val;
                            return { ...s, eqGains: next };
                          });
                        }}
                        className="accent-violet-500 cursor-pointer"
                        style={{
                          writingMode: 'vertical-lr',
                          direction: 'rtl',
                          height: '148px',
                        }}
                      />
                    </div>

                    <span className="font-mono text-[10px] text-zinc-400">{label}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.compressorEnabled}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, compressorEnabled: e.target.checked }))
                  }
                  className="accent-emerald-500"
                />
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Yayın Tipi Dinamik Ses Dengeleyici (Broadcast Compressor) Aktif</span>
              </label>

              <span className="font-mono text-[11px] text-zinc-500">
                32-bit Float DSP Pipeline
              </span>
            </div>
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
                    Corpus Audio Studio Masaüstü Kurulumu
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Audacity & Moises Masaüstü Deneyimi
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
                  <span>Corpus Audio Studio Masaüstü Uygulamasını İndir (.bat)</span>
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
      {/* CORPUS UNIFIED FOOTER (#006)                                        */}
      {/* =================================================================== */}
      <footer className="relative z-10 border-t border-zinc-900/90 py-4 px-4 sm:px-6 text-center">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">Corpus Platform</span>
            <span>•</span>
            <span>Site #006 of 100 — Corpus Audio, Vocal & Podcast Studio Pro</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Vocal Separator • 10-Band EQ • Pitch/Tempo • Lossless WAV Export
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
