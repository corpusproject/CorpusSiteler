// ---------------------------------------------------------------------------
// Corpus Audio, Vocal & Podcast Studio Pro (#006) — Web Audio DSP Engine
// ---------------------------------------------------------------------------

export type VocalMode = 'normal' | 'karaoke' | 'vocal-only' | 'podcast-clean';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;

export interface AudioDspSettings {
  vocalMode: VocalMode;
  eqGains: number[]; // 10 bands (-12 to +12 dB)
  playbackRate: number; // 0.5 to 1.8
  detuneSemitones: number; // -12 to +12
  masterGain: number; // 0.2 to 2.0
  compressorEnabled: boolean;
  fadeInSec: number;
  fadeOutSec: number;
  trimStartSec: number;
  trimEndSec: number;
}

export const EQ_PRESETS: Record<string, { label: string; gains: number[] }> = {
  flat: {
    label: 'Stüdyo Referans (Flat)',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  bassBoost: {
    label: 'Sub Bass & Kick Boost',
    gains: [8, 7, 5, 2, 0, -1, 0, 2, 3, 4],
  },
  podcastPro: {
    label: 'Podcast & Radyo Sesi',
    gains: [-6, -3, 3, -2, 0, 3, 5, 4, 3, 1],
  },
  vocalClarity: {
    label: 'Vokal Parlatıcı (Kristal)',
    gains: [-4, -2, 0, 1, 3, 5, 6, 5, 3, 2],
  },
  lofiWarm: {
    label: 'Lo-Fi Sıcak & Yumuşak',
    gains: [4, 5, 3, 2, 0, -2, -4, -6, -8, -10],
  },
};

export function createDefaultDspSettings(durationSec = 18): AudioDspSettings {
  return {
    vocalMode: 'normal',
    eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    playbackRate: 1.0,
    detuneSemitones: 0,
    masterGain: 1.0,
    compressorEnabled: true,
    fadeInSec: 0,
    fadeOutSec: 0,
    trimStartSec: 0,
    trimEndSec: durationSec,
  };
}

// ---------------------------------------------------------------------------
// 1. Decode Any Audio or Video File (MP3, WAV, FLAC, MP4, WebM, MOV)
// ---------------------------------------------------------------------------

export async function decodeMediaFileToAudioBuffer(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } finally {
    await ctx.close().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// 2. Synthesize Built-in Stereo Demo Track (Wide Instruments + Center Vocal Lead)
// ---------------------------------------------------------------------------

export function createDemoStudioAudioBuffer(): AudioBuffer {
  const sampleRate = 44100;
  const duration = 16; // 16 seconds
  const length = sampleRate * duration;
  const AudioCtx =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  const buffer = ctx.createBuffer(2, length, sampleRate);
  ctx.close().catch(() => {});

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Chord progression frequencies (A minor -> F major -> C major -> G major)
  const chords = [
    [220.0, 261.63, 329.63],
    [174.61, 220.0, 261.63],
    [261.63, 329.63, 392.0],
    [196.0, 246.94, 293.66],
  ];

  // Center-panned "Vocal Lead" melody notes
  const vocalMelody = [440, 523.25, 659.25, 587.33, 523.25, 493.88, 440, 392.0];

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const barIdx = Math.floor(t / 4) % chords.length;
    const chord = chords[barIdx];

    // 1. Wide Stereo Synth Pad & Arpeggio (Different phase in L and R so it survives Karaoke mode!)
    const padL =
      Math.sin(2 * Math.PI * chord[0] * t) * 0.16 +
      Math.sin(2 * Math.PI * chord[1] * t + 0.8) * 0.14 +
      Math.sin(2 * Math.PI * chord[2] * 2 * t) * 0.08 * Math.sin(2 * Math.PI * 3 * t);

    const padR =
      Math.sin(2 * Math.PI * chord[0] * t + 1.1) * 0.16 +
      Math.sin(2 * Math.PI * chord[2] * t - 0.7) * 0.14 +
      Math.cos(2 * Math.PI * chord[1] * 2 * t) * 0.08 * Math.cos(2 * Math.PI * 3 * t);

    // 2. Low Sub-Bass (80-110 Hz)
    const bassFreq = chord[0] / 2;
    const beatEnv = Math.exp(-((t * 2) % 1) * 4.5);
    const subBass = Math.sin(2 * Math.PI * bassFreq * t) * 0.28 * beatEnv;

    // 3. Center-Panned "Vocal Formant Lead" (Identical in L and R so Karaoke cancels it & Acappella isolates it!)
    const noteIdx = Math.floor(t * 2) % vocalMelody.length;
    const noteFreq = vocalMelody[noteIdx];
    const vibrato = Math.sin(2 * Math.PI * 5.5 * t) * 3.5;
    const noteEnv = Math.sin(((t * 2) % 1) * Math.PI);
    const vocalLead =
      (Math.sin(2 * Math.PI * (noteFreq + vibrato) * t) * 0.24 +
        Math.sin(2 * Math.PI * (noteFreq * 2 + vibrato) * t) * 0.11 +
        Math.sin(2 * Math.PI * (noteFreq * 3) * t) * 0.05) *
      noteEnv;

    left[i] = Math.max(-0.98, Math.min(0.98, padL + subBass + vocalLead));
    right[i] = Math.max(-0.98, Math.min(0.98, padR + subBass + vocalLead));
  }

  return buffer;
}

// ---------------------------------------------------------------------------
// 3. Pre-Process Buffer for Vocal Removal (Karaoke) or Vocal Isolation (Acappella)
// ---------------------------------------------------------------------------

export function processVocalModeBuffer(
  sourceBuffer: AudioBuffer,
  vocalMode: VocalMode,
  ctx: BaseAudioContext
): AudioBuffer {
  const numChannels = sourceBuffer.numberOfChannels;
  const length = sourceBuffer.length;
  const sampleRate = sourceBuffer.sampleRate;

  const out = ctx.createBuffer(2, length, sampleRate);
  const srcL = sourceBuffer.getChannelData(0);
  const srcR = numChannels > 1 ? sourceBuffer.getChannelData(1) : srcL;
  const dstL = out.getChannelData(0);
  const dstR = out.getChannelData(1);

  if (vocalMode === 'normal' || vocalMode === 'podcast-clean') {
    dstL.set(srcL);
    dstR.set(srcR);
    return out;
  }

  // Simple 1-pole low-pass filter state (~135 Hz) to preserve mono sub-bass during Karaoke
  let lpState = 0;
  const rc = 1.0 / (2 * Math.PI * 135);
  const dt = 1.0 / sampleRate;
  const alpha = dt / (rc + dt);

  for (let i = 0; i < length; i++) {
    const l = srcL[i];
    const r = srcR[i];
    const mid = (l + r) * 0.5;
    const side = (l - r) * 0.5;

    lpState = lpState + alpha * (mid - lpState);

    if (vocalMode === 'karaoke') {
      // Cancel center vocal, keep stereo side instruments + low sub-bass
      dstL[i] = Math.max(-1, Math.min(1, side * 1.35 + lpState * 0.95));
      dstR[i] = Math.max(-1, Math.min(1, -side * 1.35 + lpState * 0.95));
    } else if (vocalMode === 'vocal-only') {
      // Isolate center mid channel & suppress wide stereo instruments
      const centerWeight = Math.max(0.05, 1 - Math.abs(side) * 1.85);
      const vocalSignal = (mid - lpState * 0.65) * centerWeight * 1.35;
      dstL[i] = Math.max(-1, Math.min(1, vocalSignal));
      dstR[i] = Math.max(-1, Math.min(1, vocalSignal));
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// 4. Build Web Audio DSP Filter Graph (10-Band EQ + Compressor + Gain)
// ---------------------------------------------------------------------------

export function connectDspChain(
  ctx: BaseAudioContext,
  sourceNode: AudioNode,
  settings: AudioDspSettings,
  destinationNode: AudioNode
): BiquadFilterNode[] {
  const filters: BiquadFilterNode[] = [];

  // Optional Podcast high-pass & presence boost
  let prevNode: AudioNode = sourceNode;

  if (settings.vocalMode === 'podcast-clean') {
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 85;
    prevNode.connect(hp);
    prevNode = hp;

    const presence = ctx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 3200;
    presence.Q.value = 1.1;
    presence.gain.value = 4.5;
    prevNode.connect(presence);
    prevNode = presence;
  }

  // 10-Band Graphic Equalizer
  EQ_FREQUENCIES.forEach((freq, idx) => {
    const filter = ctx.createBiquadFilter();
    filter.type = idx === 0 ? 'lowshelf' : idx === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
    filter.frequency.value = freq;
    filter.Q.value = 1.4;
    filter.gain.value = settings.eqGains[idx] || 0;
    prevNode.connect(filter);
    prevNode = filter;
    filters.push(filter);
  });

  // Broadcast Dynamics Compressor
  if (settings.compressorEnabled) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 18;
    comp.ratio.value = 3.5;
    comp.attack.value = 0.005;
    comp.release.value = 0.18;
    prevNode.connect(comp);
    prevNode = comp;
  }

  const master = ctx.createGain();
  master.gain.value = settings.masterGain;
  prevNode.connect(master);
  master.connect(destinationNode);

  return filters;
}

// ---------------------------------------------------------------------------
// 5. Render Mastered & Trimmed Audio via OfflineAudioContext -> Lossless WAV
// ---------------------------------------------------------------------------

export async function exportMasteredWavBlob(
  sourceBuffer: AudioBuffer,
  settings: AudioDspSettings
): Promise<Blob> {
  const startSec = Math.max(0, Math.min(sourceBuffer.duration - 0.1, settings.trimStartSec));
  const endSec = Math.max(startSec + 0.1, Math.min(sourceBuffer.duration, settings.trimEndSec));
  const rawSegmentDuration = endSec - startSec;
  const effectiveDuration = rawSegmentDuration / Math.max(0.25, settings.playbackRate);

  const sampleRate = sourceBuffer.sampleRate;
  const totalFrames = Math.max(1, Math.ceil(effectiveDuration * sampleRate));

  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);
  const processedSourceBuffer = processVocalModeBuffer(
    sourceBuffer,
    settings.vocalMode,
    offlineCtx
  );

  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = processedSourceBuffer;
  bufferSource.playbackRate.value = settings.playbackRate;
  bufferSource.detune.value = settings.detuneSemitones * 100;

  // Envelope Gain for Fade-In & Fade-Out
  const envGain = offlineCtx.createGain();
  if (settings.fadeInSec > 0) {
    envGain.gain.setValueAtTime(0.001, 0);
    envGain.gain.linearRampToValueAtTime(
      1.0,
      Math.min(effectiveDuration * 0.45, settings.fadeInSec)
    );
  } else {
    envGain.gain.setValueAtTime(1.0, 0);
  }

  if (settings.fadeOutSec > 0) {
    const fadeStart = Math.max(0, effectiveDuration - settings.fadeOutSec);
    envGain.gain.setValueAtTime(1.0, fadeStart);
    envGain.gain.linearRampToValueAtTime(0.001, effectiveDuration);
  }

  bufferSource.connect(envGain);
  connectDspChain(offlineCtx, envGain, settings, offlineCtx.destination);

  bufferSource.start(0, startSec, rawSegmentDuration);
  const renderedBuffer = await offlineCtx.startRendering();

  return encodeAudioBufferToWavBlob(renderedBuffer);
}

function encodeAudioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 2;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  const numFrames = buffer.length;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataByteLength = numFrames * blockAlign;
  const totalLength = 44 + dataByteLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeStr(36, 'data');
  view.setUint32(40, dataByteLength, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    const sL = Math.max(-1, Math.min(1, left[i]));
    const sR = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true);
    offset += 2;
    view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
