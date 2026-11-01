import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  File as FileIcon,
  FileArchive,
  FileImage,
  FileVideo,
  FileText,
  FileCode,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Download,
  RefreshCw,
  ArrowUpRight,
  Wifi,
  CheckCircle2,
  XCircle,
  Sparkles,
  X,
  Lock,
  Radio,
  Zap,
  HardDrive,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type AppMode = 'sender' | 'receiver';

type TransferStatus =
  | 'idle'
  | 'initializing'
  | 'waiting'
  | 'connected'
  | 'transferring'
  | 'completed'
  | 'error';

interface FileMetadata {
  name: string;
  size: number;
  type: string;
  extension: string;
  lastModified: number;
}

interface ProtocolMessage {
  type: 'file-meta' | 'accept-transfer' | 'transfer-complete' | 'transfer-cancel';
  meta?: FileMetadata;
  chunk?: ArrayBuffer | Uint8Array;
  offset?: number;
}

const PEER_PREFIX = 'corpus-transfer-v1-';
const CHUNK_SIZE = 64 * 1024; // 64 KB WebRTC safe chunk size

// ---------------------------------------------------------------------------
// Utility Helpers
// ---------------------------------------------------------------------------

function generateRoomCode(length = 6): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatSpeed(bytesPerSecond: number): string {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return '0.0 MB/s';
  if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  }
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return 'FILE';
  return parts[parts.length - 1].toUpperCase().slice(0, 6);
}

function extractRoomFromLocation(): string | null {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (hash && /^[a-z0-9-]{4,24}$/i.test(hash)) {
    return hash.toLowerCase();
  }
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('room');
  if (roomParam && /^[a-z0-9-]{4,24}$/i.test(roomParam)) {
    return roomParam.toLowerCase();
  }
  return null;
}

function triggerSuccessConfetti() {
  try {
    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.62 },
      colors: ['#8b5cf6', '#10b981', '#a78bfa', '#34d399', '#f4f4f5'],
    });
  } catch {
    // Ignore confetti errors in restricted environments
  }
}

// ---------------------------------------------------------------------------
// File Category Icon Component
// ---------------------------------------------------------------------------

function FileTypeIcon({ extension, mimeType }: { extension: string; mimeType: string }) {
  const ext = extension.toLowerCase();
  const mime = mimeType.toLowerCase();

  if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz'].includes(ext) || mime.includes('archive') || mime.includes('zip')) {
    return <FileArchive className="w-6 h-6 text-violet-400" />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext) || mime.startsWith('image/')) {
    return <FileImage className="w-6 h-6 text-emerald-400" />;
  }
  if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext) || mime.startsWith('video/')) {
    return <FileVideo className="w-6 h-6 text-indigo-400" />;
  }
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'json', 'html', 'css', 'rs', 'go'].includes(ext)) {
    return <FileCode className="w-6 h-6 text-amber-400" />;
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'csv'].includes(ext) || mime.startsWith('text/')) {
    return <FileText className="w-6 h-6 text-sky-400" />;
  }
  return <FileIcon className="w-6 h-6 text-violet-400" />;
}

// ---------------------------------------------------------------------------
// Main Application Component
// ---------------------------------------------------------------------------

export function App() {
  // Mode & Room State
  const [mode, setMode] = useState<AppMode>(() => (extractRoomFromLocation() ? 'receiver' : 'sender'));
  const [roomId, setRoomId] = useState<string>(() => extractRoomFromLocation() || '');
  const [status, setStatus] = useState<TransferStatus>(() =>
    extractRoomFromLocation() ? 'initializing' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File & Metadata State
  const [fileMeta, setFileMeta] = useState<FileMetadata | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Transfer Progress Metrics
  const [progress, setProgress] = useState<number>(0);
  const [bytesTransferred, setBytesTransferred] = useState<number>(0);
  const [speedBps, setSpeedBps] = useState<number>(0);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);

  // UI Modals & Copy Feedback
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Mutable Refs for WebRTC / PeerJS lifecycle & streaming
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const fileRef = useRef<File | null>(null);
  const statusRef = useRef<TransferStatus>(status);
  const incomingChunksRef = useRef<BlobPart[]>([]);
  const receivedBytesRef = useRef<number>(0);
  const expectedMetaRef = useRef<FileMetadata | null>(null);
  const transferStartTimeRef = useRef<number>(0);
  const lastSpeedSampleTimeRef = useRef<number>(0);
  const lastSpeedSampleBytesRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortTransferRef = useRef<boolean>(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Shareable URL computed from current origin + pathname + #roomId
  const shareUrl = roomId
    ? `${window.location.origin}${window.location.pathname}#${roomId}`
    : '';

  // Cleanup helper
  const destroyPeerSession = useCallback(() => {
    abortTransferRef.current = true;
    if (connRef.current) {
      try {
        connRef.current.close();
      } catch {
        // ignore
      }
      connRef.current = null;
    }
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {
        // ignore
      }
      peerRef.current = null;
    }
  }, []);

  // Listen to URL hash changes (e.g. if user pastes a `#room-id` in the same tab)
  useEffect(() => {
    const handleHashChange = () => {
      const detectedRoom = extractRoomFromLocation();
      if (detectedRoom && (mode !== 'receiver' || detectedRoom !== roomId)) {
        destroyPeerSession();
        fileRef.current = null;
        setFileMeta(null);
        setProgress(0);
        setBytesTransferred(0);
        setSpeedBps(0);
        setErrorMessage(null);
        setMode('receiver');
        setRoomId(detectedRoom);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [mode, roomId, destroyPeerSession]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (downloadBlobUrl) {
        URL.revokeObjectURL(downloadBlobUrl);
      }
      destroyPeerSession();
    };
  }, [downloadBlobUrl, destroyPeerSession]);

  // -------------------------------------------------------------------------
  // SENDER LOGIC: Initialize PeerJS room & stream chunks upon receiver accept
  // -------------------------------------------------------------------------

  const streamFileToReceiver = useCallback(async (conn: DataConnection, file: File) => {
    abortTransferRef.current = false;
    setStatus('transferring');
    setProgress(0);
    setBytesTransferred(0);
    setSpeedBps(0);

    const totalSize = file.size;
    let offset = 0;
    const now = performance.now();
    transferStartTimeRef.current = now;
    lastSpeedSampleTimeRef.current = now;
    lastSpeedSampleBytesRef.current = 0;

    // Handle zero-byte files gracefully
    if (totalSize === 0) {
      conn.send({ type: 'transfer-complete' });
      setProgress(100);
      setStatus('completed');
      triggerSuccessConfetti();
      return;
    }

    try {
      while (offset < totalSize) {
        if (abortTransferRef.current || !conn.open) {
          throw new Error('Sender closed the tab or connection was lost.');
        }

        // Respect WebRTC DataChannel bufferedAmount backpressure
        const dc = (conn as unknown as { dataChannel?: RTCDataChannel }).dataChannel;
        if (dc && dc.bufferedAmount > 4 * 1024 * 1024) {
          await new Promise((resolve) => setTimeout(resolve, 15));
          continue;
        }

        const slice = file.slice(offset, offset + CHUNK_SIZE);
        const buffer = await slice.arrayBuffer();

        conn.send(buffer);
        offset += buffer.byteLength;

        const currentTime = performance.now();
        const elapsedSinceSample = (currentTime - lastSpeedSampleTimeRef.current) / 1000;

        if (elapsedSinceSample >= 0.15 || offset >= totalSize) {
          const bytesDelta = offset - lastSpeedSampleBytesRef.current;
          const instantSpeed = elapsedSinceSample > 0 ? bytesDelta / elapsedSinceSample : 0;
          setSpeedBps(instantSpeed);
          setBytesTransferred(offset);
          setProgress(Math.min(100, Math.round((offset / totalSize) * 100)));
          lastSpeedSampleTimeRef.current = currentTime;
          lastSpeedSampleBytesRef.current = offset;

          // Yield briefly so UI remains 60fps responsive
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      conn.send({ type: 'transfer-complete' });
      setBytesTransferred(totalSize);
      setProgress(100);
      setStatus('completed');
      triggerSuccessConfetti();
    } catch (err) {
      if (statusRef.current !== 'completed') {
        setStatus('error');
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Sender closed the tab or connection was lost.'
        );
      }
    }
  }, []);

  const startSenderSession = useCallback(
    (file: File) => {
      destroyPeerSession();
      abortTransferRef.current = false;

      const newRoom = generateRoomCode(6);
      const meta: FileMetadata = {
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        extension: getFileExtension(file.name),
        lastModified: file.lastModified,
      };

      fileRef.current = file;
      setFileMeta(meta);
      setRoomId(newRoom);
      setMode('sender');
      setStatus('initializing');
      setErrorMessage(null);
      setProgress(0);
      setBytesTransferred(0);
      setSpeedBps(0);

      const peer = new Peer(`${PEER_PREFIX}${newRoom}`, {
        debug: 1,
      });
      peerRef.current = peer;

      peer.on('open', () => {
        setStatus('waiting');
      });

      peer.on('connection', (conn) => {
        connRef.current = conn;

        conn.on('open', () => {
          setStatus('connected');
          // Send file metadata immediately to receiver
          conn.send({
            type: 'file-meta',
            meta,
          } satisfies ProtocolMessage);
        });

        conn.on('data', (raw) => {
          const data = raw as ProtocolMessage;
          if (data && typeof data === 'object' && data.type === 'accept-transfer') {
            if (fileRef.current) {
              streamFileToReceiver(conn, fileRef.current);
            }
          }
        });

        conn.on('close', () => {
          if (statusRef.current !== 'completed') {
            setStatus('error');
            setErrorMessage('Receiver disconnected before the transfer could finish.');
          }
        });

        conn.on('error', () => {
          if (statusRef.current !== 'completed') {
            setStatus('error');
            setErrorMessage('WebRTC data channel error. Connection was interrupted.');
          }
        });
      });

      peer.on('error', (err) => {
        setStatus('error');
        setErrorMessage(
          err.type === 'unavailable-id'
            ? 'Session ID collision detected. Click Reset to generate a new room.'
            : 'Unable to reach WebRTC signaling server. Check your network connection.'
        );
      });
    },
    [destroyPeerSession, streamFileToReceiver]
  );

  // -------------------------------------------------------------------------
  // RECEIVER LOGIC: Connect to Sender's PeerJS ID & reconstruct file chunks
  // -------------------------------------------------------------------------

  const triggerBrowserDownload = useCallback((url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const connectAsReceiver = useCallback(
    (targetRoom: string) => {
      destroyPeerSession();
      abortTransferRef.current = false;
      incomingChunksRef.current = [];
      receivedBytesRef.current = 0;
      expectedMetaRef.current = null;

      setStatus('initializing');
      setErrorMessage(null);
      setProgress(0);
      setBytesTransferred(0);
      setSpeedBps(0);

      const peer = new Peer({ debug: 1 });
      peerRef.current = peer;

      peer.on('open', () => {
        const conn = peer.connect(`${PEER_PREFIX}${targetRoom}`, {
          reliable: true,
        });
        connRef.current = conn;

        conn.on('open', () => {
          setStatus('waiting');
        });

        conn.on('data', (data: unknown) => {
          // 1. Check if incoming packet is a control message object
          if (
            data &&
            typeof data === 'object' &&
            !(data instanceof ArrayBuffer) &&
            !(data instanceof Uint8Array) &&
            !(data instanceof Blob) &&
            'type' in (data as Record<string, unknown>)
          ) {
            const msg = data as ProtocolMessage;
            if (msg.type === 'file-meta' && msg.meta) {
              expectedMetaRef.current = msg.meta;
              setFileMeta(msg.meta);
              setStatus('connected');
              return;
            }

            if (msg.type === 'transfer-complete') {
              const meta = expectedMetaRef.current;
              const blob = new Blob(incomingChunksRef.current, {
                type: meta?.type || 'application/octet-stream',
              });
              const url = URL.createObjectURL(blob);
              setDownloadBlobUrl(url);
              setBytesTransferred(meta?.size ?? receivedBytesRef.current);
              setProgress(100);
              setStatus('completed');
              triggerSuccessConfetti();
              if (meta?.name) {
                triggerBrowserDownload(url, meta.name);
              }
              return;
            }
          }

          // 2. Otherwise it's a binary chunk (ArrayBuffer / Uint8Array / Blob)
          let chunkByteLength = 0;
          if (data instanceof ArrayBuffer) {
            incomingChunksRef.current.push(data);
            chunkByteLength = data.byteLength;
          } else if (data instanceof Uint8Array) {
            incomingChunksRef.current.push(data as unknown as BlobPart);
            chunkByteLength = data.byteLength;
          } else if (data instanceof Blob) {
            incomingChunksRef.current.push(data);
            chunkByteLength = data.size;
          } else if (
            data &&
            typeof data === 'object' &&
            'byteLength' in (data as Record<string, unknown>)
          ) {
            const ab = data as ArrayBuffer;
            incomingChunksRef.current.push(ab);
            chunkByteLength = ab.byteLength;
          }

          if (chunkByteLength > 0) {
            receivedBytesRef.current += chunkByteLength;
            const totalExpected = expectedMetaRef.current?.size || 1;
            const currentBytes = receivedBytesRef.current;

            const now = performance.now();
            if (transferStartTimeRef.current === 0) {
              transferStartTimeRef.current = now;
              lastSpeedSampleTimeRef.current = now;
              lastSpeedSampleBytesRef.current = 0;
            }

            const elapsed = (now - lastSpeedSampleTimeRef.current) / 1000;
            if (elapsed >= 0.15 || currentBytes >= totalExpected) {
              const delta = currentBytes - lastSpeedSampleBytesRef.current;
              setSpeedBps(elapsed > 0 ? delta / elapsed : 0);
              setBytesTransferred(currentBytes);
              setProgress(Math.min(100, Math.round((currentBytes / totalExpected) * 100)));
              lastSpeedSampleTimeRef.current = now;
              lastSpeedSampleBytesRef.current = currentBytes;
            }
          }
        });

        conn.on('close', () => {
          if (statusRef.current !== 'completed') {
            setStatus('error');
            setErrorMessage('Sender closed the tab or connection was lost.');
          }
        });

        conn.on('error', () => {
          if (statusRef.current !== 'completed') {
            setStatus('error');
            setErrorMessage('Sender closed the tab or connection was lost.');
          }
        });
      });

      peer.on('error', (err) => {
        setStatus('error');
        if (err.type === 'peer-unavailable') {
          setErrorMessage(
            'Sender closed the tab or connection was lost. Verify the link is still active.'
          );
        } else {
          setErrorMessage('Connection failed: Unable to establish peer-to-peer tunnel.');
        }
      });
    },
    [destroyPeerSession, triggerBrowserDownload]
  );

  // Trigger receiver connection automatically when in receiver mode with a roomId
  useEffect(() => {
    if (mode === 'receiver' && roomId) {
      connectAsReceiver(roomId);
    }
  }, [mode, roomId, connectAsReceiver]);

  const handleAcceptAndDownload = () => {
    if (!connRef.current || !connRef.current.open) {
      setStatus('error');
      setErrorMessage('Sender closed the tab or connection was lost.');
      return;
    }
    incomingChunksRef.current = [];
    receivedBytesRef.current = 0;
    transferStartTimeRef.current = performance.now();
    lastSpeedSampleTimeRef.current = performance.now();
    lastSpeedSampleBytesRef.current = 0;
    setStatus('transferring');
    connRef.current.send({ type: 'accept-transfer' } satisfies ProtocolMessage);
  };

  // -------------------------------------------------------------------------
  // Reset & File Selection Handlers
  // -------------------------------------------------------------------------

  const handleReset = () => {
    destroyPeerSession();
    if (downloadBlobUrl) {
      URL.revokeObjectURL(downloadBlobUrl);
      setDownloadBlobUrl(null);
    }
    // Clear hash without triggering full page reload
    if (window.location.hash || window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    fileRef.current = null;
    setFileMeta(null);
    setRoomId('');
    setMode('sender');
    setStatus('idle');
    setErrorMessage(null);
    setProgress(0);
    setBytesTransferred(0);
    setSpeedBps(0);
    setShowQrModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      startSenderSession(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      startSenderSession(file);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // -------------------------------------------------------------------------
  // Status Step Indicator Helper
  // -------------------------------------------------------------------------

  const getStepState = (step: 'waiting' | 'connected' | 'transferring' | 'completed') => {
    const order: Record<string, number> = {
      initializing: 0,
      waiting: 1,
      connected: 2,
      transferring: 3,
      completed: 4,
    };
    const currentRank = order[status] ?? 0;
    const stepRank = order[step];
    if (status === 'completed') return 'done';
    if (currentRank > stepRank) return 'done';
    if (currentRank === stepRank) return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col justify-between relative selection:bg-violet-500/30 corpus-grid-bg">
      {/* Subtle Ambient Top Glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 50% at 50% -15%, rgba(139, 92, 246, 0.16), rgba(16, 185, 129, 0.04), transparent)',
        }}
      />

      {/* =================================================================== */}
      {/* CORPUS UNIFIED HEADER                                               */}
      {/* =================================================================== */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="group flex items-center gap-2.5 text-left focus:outline-none"
              title="Corpus Transfer — Reset to Home"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/25 via-violet-500/10 to-zinc-900 border border-violet-500/40 flex items-center justify-center shadow-[0_0_20px_-4px_rgba(139,92,246,0.45)] group-hover:border-violet-400 transition-colors">
                <Zap className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-sm sm:text-base">
                  Corpus
                </span>
                <span className="text-zinc-600 font-light">/</span>
                <span className="font-medium text-zinc-300 text-sm sm:text-base">Transfer</span>
              </div>
            </button>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
              #001
            </span>
          </div>

          {/* Security Badge */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800/90 text-xs text-zinc-300 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Lock className="w-3 h-3 text-violet-400 hidden xs:inline" />
              <span className="font-medium tracking-tight text-[11px] sm:text-xs">
                P2P Encrypted • No Server Storage
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* MAIN CENTERED WORKSPACE                                             */}
      {/* =================================================================== */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-xl">
          {/* Hero Subheading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-3">
              <Radio className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span>
                {mode === 'sender'
                  ? 'Direct Browser-to-Browser WebRTC Tunnel'
                  : `Incoming Peer Session • #${roomId}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
              {mode === 'sender' ? 'Zero-Storage File Transfer' : 'Receive Direct P2P File'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-md mx-auto">
              {mode === 'sender'
                ? 'Stream files of any format directly between devices. Nothing is ever uploaded to a cloud server.'
                : 'Connected to a live peer session. Accept below to stream bytes directly from the sender.'}
            </p>
          </div>

          {/* Primary Card */}
          <div className="rounded-2xl bg-[#111114]/90 backdrop-blur-2xl border border-zinc-800/80 corpus-card-glow overflow-hidden transition-all duration-300">
            {/* Top Card Bar */}
            <div className="px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  {mode === 'sender' ? 'Outbound Node' : 'Inbound Node'}
                </span>
                {roomId && (
                  <span className="px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300 font-mono text-xs">
                    #{roomId}
                  </span>
                )}
              </div>

              {(status !== 'idle' || mode === 'receiver') && (
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 px-2.5 py-1 rounded-lg hover:bg-zinc-800/70 border border-transparent hover:border-zinc-700/70 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              {/* ============================================================= */}
              {/* STATE 1: SENDER — IDLE (DRAG & DROP ZONE)                     */}
              {/* ============================================================= */}
              {mode === 'sender' && status === 'idle' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`group relative cursor-pointer rounded-xl border-2 border-dashed p-8 sm:p-11 text-center transition-all duration-300 ${
                      isDragging
                        ? 'border-violet-400 bg-violet-500/10 scale-[1.01]'
                        : 'border-zinc-800 hover:border-violet-500/60 bg-zinc-950/50 hover:bg-zinc-900/50 animate-pulse-border'
                    }`}
                  >
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-b from-violet-500/20 to-violet-500/5 border border-violet-500/30 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:border-violet-400/60 transition-transform">
                      <UploadCloud className="w-7 h-7 text-violet-400" />
                    </div>

                    <p className="text-base font-medium text-zinc-100">
                      Drag & drop a file here, or{' '}
                      <span className="text-violet-400 underline decoration-violet-500/40 underline-offset-4">
                        browse device
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                      Any file type • Streamed in 64 KB WebRTC chunks • Zero cloud retention
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-zinc-400">
                      <span className="px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800">
                        WebRTC DataChannel
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800">
                        DTLS 1.3 Encrypted
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800">
                        Instant QR & Link
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* STATE 2: SENDER — ACTIVE FILE & LINK/QR SHARING               */}
              {/* ============================================================= */}
              {mode === 'sender' && status !== 'idle' && fileMeta && (
                <div className="space-y-5">
                  {/* File Metadata Inspection Card */}
                  <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/90 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        <FileTypeIcon extension={fileMeta.extension} mimeType={fileMeta.type} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-sm font-medium text-zinc-100 truncate"
                            title={fileMeta.name}
                          >
                            {fileMeta.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 font-mono">
                          <span>{formatBytes(fileMeta.size)}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[10px] font-semibold">
                            {fileMeta.extension}
                          </span>
                        </div>
                      </div>
                    </div>

                    {status === 'waiting' && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors shrink-0 cursor-pointer"
                      >
                        Change
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Shareable Session Link & QR Controls */}
                  {status !== 'error' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-medium">
                          Share Session Link with Receiver
                        </span>
                        <a
                          href={shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 font-medium transition-colors"
                          title="Open a second tab to test P2P transfer locally"
                        >
                          <span>Open Receiver Tab</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-nowrap">
                          {shareUrl}
                        </div>

                        <button
                          onClick={handleCopyLink}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                            copied
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_-4px_rgba(139,92,246,0.6)]'
                          }`}
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setShowQrModal(true)}
                          className="inline-flex items-center justify-center p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors shrink-0 cursor-pointer"
                          title="Show QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Connection Pipeline Indicator */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {(
                      [
                        { key: 'waiting', label: 'Waiting for receiver...' },
                        { key: 'connected', label: 'Connected' },
                        { key: 'transferring', label: 'Transferring...' },
                        { key: 'completed', label: 'Completed' },
                      ] as const
                    ).map((step) => {
                      const state = getStepState(step.key);
                      return (
                        <div
                          key={step.key}
                          className={`rounded-xl p-2.5 border text-center transition-all ${
                            state === 'active'
                              ? 'bg-violet-500/15 border-violet-500/50 text-violet-200'
                              : state === 'done'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-zinc-950/40 border-zinc-800/70 text-zinc-500'
                          }`}
                        >
                          <div className="flex items-center justify-center mb-1">
                            {state === 'done' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : state === 'active' ? (
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-400"></span>
                              </span>
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-zinc-700" />
                            )}
                          </div>
                          <p className="text-[11px] font-medium leading-tight truncate">
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Transfer Progress Bar (Sender) */}
                  {(status === 'transferring' || status === 'completed') && (
                    <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-200">
                            {status === 'completed'
                              ? 'Direct P2P Transfer Complete'
                              : 'Streaming binary chunks...'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          {status === 'transferring' && (
                            <span className="text-violet-400">{formatSpeed(speedBps)}</span>
                          )}
                          <span className="text-zinc-500">•</span>
                          <span className="text-emerald-400 font-semibold">{progress}%</span>
                        </div>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                        <div
                          className={`h-full transition-all duration-150 rounded-full ${
                            status === 'completed'
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-violet-600 via-violet-400 to-emerald-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>
                          {formatBytes(bytesTransferred)} / {formatBytes(fileMeta.size)}
                        </span>
                        <span>Chunk size: 64 KB</span>
                      </div>
                    </div>
                  )}

                  {/* Completed Banner (Sender) */}
                  {status === 'completed' && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-200">
                            File delivered directly to peer!
                          </p>
                          <p className="text-[11px] text-emerald-300/80">
                            Zero bytes were stored on any intermediate server.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleReset}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                      >
                        Send Another
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* STATE 3: RECEIVER FLOW                                        */}
              {/* ============================================================= */}
              {mode === 'receiver' && (
                <div className="space-y-5">
                  {/* Connecting / Waiting for metadata */}
                  {(status === 'initializing' || (status === 'waiting' && !fileMeta)) && (
                    <div className="py-10 text-center space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                        <Wifi className="w-6 h-6 text-violet-400 animate-pulse" />
                      </div>
                      <p className="text-sm font-medium text-zinc-200">
                        Establishing direct WebRTC tunnel to peer{' '}
                        <span className="font-mono text-violet-400">#{roomId}</span>...
                      </p>
                      <p className="text-xs text-zinc-500">
                        Negotiating ICE candidates & DTLS encryption keys
                      </p>
                    </div>
                  )}

                  {/* Incoming File Metadata Card */}
                  {fileMeta && (
                    <div className="p-4 sm:p-5 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                          Incoming File Ready
                        </span>
                        <span className="text-xs font-mono text-zinc-400">
                          Peer #{roomId}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-13 h-13 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                          <FileTypeIcon
                            extension={fileMeta.extension}
                            mimeType={fileMeta.type}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-base font-semibold text-zinc-100 truncate"
                            title={fileMeta.name}
                          >
                            {fileMeta.name}
                          </p>
                          <p className="text-xs font-mono text-zinc-400 mt-1">
                            {fileMeta.name} • {formatBytes(fileMeta.size)}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-300 font-mono text-xs font-semibold">
                          {fileMeta.extension}
                        </span>
                      </div>

                      {/* Accept & Download CTA */}
                      {status === 'connected' && (
                        <button
                          onClick={handleAcceptAndDownload}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_-4px_rgba(139,92,246,0.65)] transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Accept & Download ({formatBytes(fileMeta.size)})</span>
                        </button>
                      )}

                      {/* Receiver Progress Bar */}
                      {(status === 'transferring' || status === 'completed') && (
                        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-zinc-200">
                              {status === 'completed'
                                ? 'File reconstructed & downloaded!'
                                : 'Receiving direct P2P chunks...'}
                            </span>
                            <div className="flex items-center gap-2 font-mono">
                              {status === 'transferring' && (
                                <span className="text-violet-400">{formatSpeed(speedBps)}</span>
                              )}
                              <span className="text-zinc-500">•</span>
                              <span className="text-emerald-400 font-semibold">{progress}%</span>
                            </div>
                          </div>

                          <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                            <div
                              className={`h-full transition-all duration-150 rounded-full ${
                                status === 'completed'
                                  ? 'bg-emerald-500'
                                  : 'bg-gradient-to-r from-violet-600 via-violet-400 to-emerald-400'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                            <span>
                              {formatBytes(bytesTransferred)} / {formatBytes(fileMeta.size)}
                            </span>
                            <span>Memory Blob Assembly</span>
                          </div>
                        </div>
                      )}

                      {/* Save Again / Send Your Own File after completion */}
                      {status === 'completed' && downloadBlobUrl && (
                        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                          <a
                            href={downloadBlobUrl}
                            download={fileMeta.name}
                            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span>Save File Again</span>
                          </a>
                          <button
                            onClick={handleReset}
                            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors cursor-pointer"
                          >
                            Send a File Instead
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* ERROR STATE BANNER                                            */}
              {/* ============================================================= */}
              {status === 'error' && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-rose-200">
                        Peer Connection Interrupted
                      </p>
                      <p className="text-xs text-rose-300/90 mt-0.5">
                        {errorMessage || 'Sender closed the tab or connection was lost.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-medium transition-colors shrink-0 cursor-pointer"
                  >
                    Start Fresh
                  </button>
                </div>
              )}

              {/* ============================================================= */}
              {/* CRITICAL CAVEAT UX WARNING (ALWAYS VISIBLE)                   */}
              {/* ============================================================= */}
              <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/20 px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Keep this tab open until the transfer completes. The file transfers directly from
                  your device.
                </p>
              </div>
            </div>
          </div>

          {/* Architecture Highlights Bar */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-300">
                <HardDrive className="w-3.5 h-3.5 text-violet-400" />
                <span>0 GB Cloud Storage</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Direct RAM-to-RAM stream</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>End-to-End DTLS</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Native WebRTC encryption</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>No Size Limits</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">64 KB chunked backpressure</p>
            </div>
          </div>
        </div>
      </main>

      {/* =================================================================== */}
      {/* QR CODE MODAL FLYOUT                                                */}
      {/* =================================================================== */}
      {showQrModal && shareUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#121216] border border-zinc-800 p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Scan to Receive File</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Session <span className="font-mono text-violet-400">#{roomId}</span>
                </p>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-xl flex items-center justify-center mx-auto w-fit shadow-inner">
              <QRCodeSVG
                value={shareUrl}
                size={200}
                bgColor="#ffffff"
                fgColor="#09090b"
                level="M"
              />
            </div>

            <p className="text-xs text-center text-zinc-400 leading-relaxed">
              Point your phone or tablet camera at this QR code to open the direct P2P receiver link.
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CORPUS UNIFIED FOOTER                                               */}
      {/* =================================================================== */}
      <footer className="relative z-10 border-t border-zinc-900/90 py-4 px-4 sm:px-6 text-center">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">Corpus Platform</span>
            <span>•</span>
            <span>Site #001 of 100 — Corpus Transfer</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            WebRTC P2P • Zero Cloud Persistence
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
