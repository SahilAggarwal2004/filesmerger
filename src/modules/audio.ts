import { LoadedAudio, AudioFormat, AudioSegment } from "@/types";
import { generateId } from "./utils";

async function audioBufferToMp3(buffer: AudioBuffer, bitrateValue: number) {
  const numberOfChannels = Math.min(buffer.numberOfChannels, 2);
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;

  const channelData: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) channelData.push(buffer.getChannelData(i));

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const worker = new Worker(new URL("../workers/lame.ts", import.meta.url));

    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };

    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };

    worker.postMessage({
      channelData: channelData.map((c) => Array.from(c)),
      sampleRate,
      numberOfChannels,
      length,
      bitrateValue,
    });
  });
}

function audioBufferToWav(buffer: AudioBuffer) {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Convert audio data
  let offset = 44;
  for (let i = 0; i < length; i++)
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }

  return arrayBuffer;
}

function changeAudioRate(ctx: AudioContext, buffer: AudioBuffer, rate: number) {
  const originalLength = buffer.length;
  const newLength = Math.floor(originalLength / rate);
  const numberOfChannels = buffer.numberOfChannels;
  const newBuffer = ctx.createBuffer(numberOfChannels, newLength, buffer.sampleRate);

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const originalData = buffer.getChannelData(channel);
    const newData = newBuffer.getChannelData(channel);
    for (let i = 0; i < newLength; i++) {
      const originalIndex = i * rate;
      const floorIndex = Math.floor(originalIndex);
      const ceilIndex = Math.min(floorIndex + 1, originalLength - 1);
      const fraction = originalIndex - floorIndex;
      const sample1 = originalData[floorIndex] || 0;
      const sample2 = originalData[ceilIndex] || 0;
      newData[i] = sample1 + (sample2 - sample1) * fraction;
    }
  }

  return newBuffer;
}

export function combineAudioBuffers(ctx: AudioContext, segments: AudioSegment[]) {
  if (!segments.length) return null;

  const sampleRate = segments[0].buffer.sampleRate;
  const numberOfChannels = Math.max(...segments.map((s) => s.buffer.numberOfChannels));
  const totalLength = Math.max(...segments.map((s) => Math.floor((s.startTime + s.buffer.duration) * sampleRate)));
  const combinedBuffer = ctx.createBuffer(numberOfChannels, totalLength, sampleRate);

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const combinedData = combinedBuffer.getChannelData(channel);
    segments.forEach(({ buffer, startTime, volume = 1 }) => {
      const channelData = buffer.getChannelData(Math.min(channel, buffer.numberOfChannels - 1));
      const startSample = Math.floor(startTime * sampleRate);
      for (let i = 0; i < buffer.length; i++) {
        const targetIndex = startSample + i;
        if (targetIndex < combinedData.length) combinedData[targetIndex] += channelData[i] * volume;
      }
    });
  }

  return combinedBuffer;
}

export async function encodeToFormat(buffer: AudioBuffer, format: AudioFormat, bitrate: number) {
  if (format === "wav") {
    const wavArrayBuffer = audioBufferToWav(buffer);
    return new Blob([wavArrayBuffer], { type: "audio/wav" });
  } else {
    const mp3ArrayBuffer = await audioBufferToMp3(buffer, bitrate);
    return new Blob([mp3ArrayBuffer], { type: "audio/mpeg" });
  }
}

export function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function loadAudio(file: File) {
  if (!file.type.startsWith("audio/")) return Promise.resolve(null);
  const url = URL.createObjectURL(file);
  return new Promise<LoadedAudio>((resolve) => {
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => resolve({ id: generateId(), file, name: file.name, url, size: file.size, duration: audio.duration }));
  });
}

export async function loadAudioBuffer(ctx: AudioContext, loadedAudio: LoadedAudio, range: string = "", rate: number = 1) {
  const { duration, file } = loadedAudio;
  const { start, end } = parseTimeRange(range, duration);
  const arrayBuffer = await file.arrayBuffer();
  let buffer = await ctx.decodeAudioData(arrayBuffer);
  if (start !== 0 || end !== duration) buffer = trimAudioBuffer(ctx, buffer, start, end);
  if (rate !== 1) buffer = changeAudioRate(ctx, buffer, rate);
  return buffer;
}

export async function loadAudios(files: FileList) {
  const audioPromises = Array.from(files).map((file) => loadAudio(file));
  return await Promise.all(audioPromises);
}

function parseTimeRange(range: string, duration: number) {
  if (!range.trim()) return { start: 0, end: duration };
  try {
    const parts = range.split("-").map((p) => p.trim());
    const start = +parts[0] || 0;
    const end = +parts[1] || duration;
    return { start: Math.max(0, start), end: Math.min(duration, end) };
  } catch (error) {
    console.error("Error parsing time range:", error);
    return { start: 0, end: duration };
  }
}

function trimAudioBuffer(ctx: AudioContext, buffer: AudioBuffer, start: number, end: number) {
  const startSample = Math.floor(start * buffer.sampleRate);
  const endSample = Math.floor(end * buffer.sampleRate);
  const length = endSample - startSample;
  const trimmedBuffer = ctx.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    const trimmedData = trimmedBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) trimmedData[i] = channelData[startSample + i];
  }

  return trimmedBuffer;
}
