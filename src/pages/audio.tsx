/* eslint-disable react-hooks/exhaustive-deps */
import Head from "next/head";
import { useState, useEffect, useMemo, isValidElement, useRef } from "react";
import { BsMusicNoteBeamed, BsPauseFill, BsPlayFill } from "react-icons/bs";
import ReorderList, { ReorderIcon } from "react-reorder-list";

import FileDropZone from "@/components/FileDropZone";
import { audioFormatDescriptions, audioFormats, constraints, modes } from "@/constants";
import { combineAudioBuffers, encodeToFormat, formatDuration, loadAudioBuffer, loadAudios } from "@/lib/audio";
import { calcSize, download, formatFileSize, generateId, normalize } from "@/lib/utils";
import { LoadedAudio, AudioSelections, AudioFormat, AudioSegment } from "@/types";

const { volumeConstraints, rateConstraints, startAtConstraints, bitrateConstraints } = constraints;

export default function AudioMerger() {
  const [loadedAudios, setLoadedAudios] = useState<LoadedAudio[]>([]);
  const [selectedMode, setSelectedMode] = useState<Mode>("simple");
  const [simpleSelections, setSimpleSelections] = useState<AudioSelections["simple"]>({});
  const [advancedSelections, setAdvancedSelections] = useState<AudioSelections["advanced"]>([]);
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<AudioFormat>("wav");
  const [bitrate, setBitrate] = useState<number>(128);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const createdUrls = useRef<Set<string>>(new Set());
  const playingAudios = useRef<Map<string, HTMLAudioElement>>(new Map());

  const totalSize = useMemo(() => calcSize(loadedAudios), [loadedAudios]);

  const handleSimpleUpdate = (id: string, update: Partial<SimpleSelection<AudioSelections>>) => setSimpleSelections((prev) => ({ ...prev, [id]: { ...prev[id], ...update } }));

  const handleAdvancedUpdate = (id: string, update: Partial<AdvancedSelection<AudioSelections>>) =>
    setAdvancedSelections((prev) => prev.map((sel) => (sel.id === id ? { ...sel, ...update } : sel)));

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { files } = event.target;
    if (files?.length) {
      loadAudios(files).then((audios) => setLoadedAudios((prev) => prev.concat(audios.filter((audio) => audio !== null))));
      setMergedAudioUrl(null);
    }
    event.target.value = "";
  }

  function removeFile(id: string) {
    setLoadedAudios((prev) => prev.filter((file) => file.id !== id));
    setAdvancedSelections([]);
  }

  async function handleMerge() {
    if (!loadedAudios.length) return;

    setIsProcessing(true);
    let audioContext;

    try {
      const segments: AudioSegment[] = [];
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      if (selectedMode === "simple") {
        let currentTime = 0;
        for (const loadedAudio of loadedAudios) {
          const { range, volume, rate } = simpleSelections[loadedAudio.id] || {};
          const buffer = await loadAudioBuffer(audioContext, loadedAudio, range, rate);
          segments.push({ buffer, startTime: currentTime, volume });
          currentTime += buffer.duration;
        }
      } else
        for (const { audioIndex, range, startAt = 0, volume, rate } of advancedSelections) {
          const buffer = await loadAudioBuffer(audioContext, loadedAudios[audioIndex], range, rate);
          segments.push({ buffer, startTime: startAt, volume });
        }

      const combinedBuffer = combineAudioBuffers(audioContext, segments);
      if (!combinedBuffer) throw new Error("Failed to combine audio buffers");

      const blob = await encodeToFormat(combinedBuffer, outputFormat, bitrate);
      const url = URL.createObjectURL(blob);
      if (mergedAudioUrl) {
        URL.revokeObjectURL(mergedAudioUrl);
        createdUrls.current.delete(mergedAudioUrl);
      }
      createdUrls.current.add(url);
      setMergedAudioUrl(url);
    } catch (error) {
      console.error("Error merging audio:", error);
      alert("Failed to merge audio files. Please try again.");
    } finally {
      audioContext?.close();
      setIsProcessing(false);
    }
  }

  function toggleAudioPlayback({ id, url }: Pick<LoadedAudio, "id" | "url">) {
    const audioElement = playingAudios.current.get(id);
    if (audioElement && !audioElement.paused) {
      audioElement.pause();
      setCurrentPlayingId(null);
    } else {
      playingAudios.current.forEach((audio) => audio.pause());
      if (audioElement) audioElement.play();
      else {
        const newAudio = new Audio(url);
        newAudio.addEventListener("ended", () => setCurrentPlayingId(null));
        playingAudios.current.set(id, newAudio);
        newAudio.play();
      }
      setCurrentPlayingId(id);
    }
  }

  function clearAll() {
    setLoadedAudios([]);
    setSimpleSelections({});
    setAdvancedSelections([]);
    setMergedAudioUrl(null);
    setCurrentPlayingId(null);
    playingAudios.current.forEach((audio) => {
      audio.pause();
      audio.src = "";
    });
    playingAudios.current.clear();
    createdUrls.current.forEach((url) => URL.revokeObjectURL(url));
    createdUrls.current.clear();
  }

  useEffect(() => clearAll, []);

  useEffect(() => {
    return () => {
      playingAudios.current.forEach((audio) => audio.pause());
      setCurrentPlayingId(null);
    };
  }, [mergedAudioUrl, loadedAudios]);

  return (
    <>
      <Head>
        <title>Audio Merger | FilesMerger</title>
      </Head>

      <main className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-5">
              <h1 className="text-3xl font-bold text-white">Audio Merger</h1>
            </div>

            <fieldset disabled={isProcessing}>
              <div className="block p-5 space-y-8">
                <FileDropZone tool="audio" Icon={BsMusicNoteBeamed} handleFileChange={handleFileChange} totalSize={totalSize} />

                {loadedAudios.length > 0 && (
                  <div>
                    <div className="flex gap-2 mb-4">
                      {modes.map((mode) => (
                        <button
                          key={mode}
                          className={`px-4 py-2 rounded-lg text-sm font-medium shadow capitalize ${
                            mode === selectedMode ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 dark:text-white"
                          }`}
                          onClick={() => setSelectedMode(mode)}
                        >
                          {mode} Mode
                        </button>
                      ))}
                    </div>

                    {selectedMode === "simple" ? (
                      <div className="space-y-4">
                        <ReorderList
                          useOnlyIconToDrag
                          watchChildrenUpdates
                          animationDuration={200}
                          props={{ className: "space-y-2" }}
                          onPositionChange={({ newItems }) => {
                            const reorderedFiles = newItems.flatMap((item) => (isValidElement(item) ? loadedAudios.find(({ id }) => item.key === id)! : []));
                            setLoadedAudios(reorderedFiles);
                          }}
                        >
                          {loadedAudios.map(({ duration, id, name, size, url }) => {
                            const { range = "", volume = "", rate = "" } = simpleSelections[id] || {};
                            return (
                              <div key={id} className="flex items-start py-2 border rounded-xl shadow-sm text-sm">
                                <ReorderIcon className="w-5 mt-2 mx-1.5 shrink-0" />
                                <div className="flex-1 space-y-3">
                                  <div className="flex gap-2 items-center">
                                    <button
                                      onClick={() => toggleAudioPlayback({ id, url })}
                                      className="shrink-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                                    >
                                      <span className="scale-130 pl-px">{id === currentPlayingId ? <BsPauseFill /> : <BsPlayFill />}</span>
                                    </button>
                                    <div className="flex-1">
                                      <div className="font-medium block whitespace-nowrap overflow-hidden text-ellipsis">{name}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {duration ? formatDuration(duration) : "Loading..."} • {formatFileSize(size)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time Range</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. 5-30.2"
                                        value={range}
                                        onChange={(e) => handleSimpleUpdate(id, { range: e.target.value })}
                                        className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Volume</label>
                                      <input
                                        type="number"
                                        {...volumeConstraints}
                                        placeholder={`1 (${volumeConstraints.min}-${volumeConstraints.max})`}
                                        defaultValue={volume}
                                        onChange={(e) => handleSimpleUpdate(id, { volume: normalize(e.target.value, volumeConstraints, 1) })}
                                        className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Playback Rate</label>
                                      <input
                                        type="number"
                                        {...rateConstraints}
                                        placeholder={`1 (${rateConstraints.min}-${rateConstraints.max})`}
                                        defaultValue={rate}
                                        onChange={(e) => handleSimpleUpdate(id, { rate: normalize(e.target.value, rateConstraints, 1) })}
                                        className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <button onClick={() => removeFile(id)} className="text-red-500 hover:text-red-700 w-5 mt-2 mx-1.5 shrink-0">
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </ReorderList>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">
                          Leave the range blank to include the entire audio. Set the volume (1 is normal) and rate (1 is normal).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <ReorderList
                          useOnlyIconToDrag
                          watchChildrenUpdates
                          animationDuration={200}
                          props={{ className: "space-y-2" }}
                          onPositionChange={({ newItems }) => {
                            const reorderedSelections = newItems.flatMap((item) => (isValidElement(item) ? advancedSelections.find(({ id }) => item.key === id)! : []));
                            setAdvancedSelections(reorderedSelections);
                          }}
                        >
                          {advancedSelections.map(({ id, audioIndex, range = "", volume = "", rate = "", startAt = "" }) => (
                            <div key={id} className="flex items-start py-2 border rounded-xl shadow-sm text-sm">
                              <ReorderIcon className="w-5 mt-2 mx-1.5 shrink-0" />
                              <div className="flex-1 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Audio</label>
                                  <select
                                    value={audioIndex}
                                    onChange={(e) => handleAdvancedUpdate(id, { audioIndex: +e.target.value })}
                                    className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                  >
                                    {loadedAudios.map(({ name }, i) => (
                                      <option key={i} value={i}>
                                        {name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:grid-cols-4">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time Range</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. 5-30.2"
                                      value={range}
                                      onChange={(e) => handleAdvancedUpdate(id, { range: e.target.value })}
                                      className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Volume</label>
                                    <input
                                      type="number"
                                      {...volumeConstraints}
                                      placeholder={`1 (${volumeConstraints.min}-${volumeConstraints.max})`}
                                      defaultValue={volume}
                                      onChange={(e) => handleAdvancedUpdate(id, { volume: normalize(e.target.value, volumeConstraints, 1) })}
                                      className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Playback Rate</label>
                                    <input
                                      type="number"
                                      {...rateConstraints}
                                      placeholder={`1 (${rateConstraints.min}-${rateConstraints.max})`}
                                      defaultValue={rate}
                                      onChange={(e) => handleAdvancedUpdate(id, { rate: normalize(e.target.value, rateConstraints, 1) })}
                                      className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start At (seconds)</label>
                                    <input
                                      type="number"
                                      {...startAtConstraints}
                                      placeholder="Start time"
                                      defaultValue={startAt}
                                      onChange={(e) => handleAdvancedUpdate(id, { startAt: normalize(e.target.value, startAtConstraints, 0) })}
                                      className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => setAdvancedSelections((prev) => prev.filter((sel) => sel.id !== id))}
                                className="text-red-500 hover:text-red-700 w-5 mt-2 mx-1.5 shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </ReorderList>
                        {advancedSelections.length > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Leave the range empty for full audio. Set volume (1 is normal), rate (1 is normal). Set &quot;Start at&quot; to specify when this audio should begin in
                            the timeline (for overlapping).
                          </p>
                        )}
                        <button
                          onClick={() => setAdvancedSelections((prev) => [...prev, { id: generateId(), audioIndex: 0 }])}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg shadow text-sm"
                        >
                          + Add Audio Selection
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Output Format</label>
                    <select
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value as AudioFormat)}
                    >
                      {audioFormats.map((format) => (
                        <option key={format} value={format}>
                          {audioFormatDescriptions[format]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {outputFormat === "mp3" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bitrate: {bitrate} kbps</label>
                      <input
                        type="range"
                        {...bitrateConstraints}
                        value={bitrate}
                        onChange={(e) => setBitrate(+e.target.value)}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{bitrateConstraints.min} kbps</span>
                        <span>{bitrateConstraints.max} kbps</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleMerge}
                    disabled={(selectedMode === "simple" ? !loadedAudios.length : !advancedSelections.length) || isProcessing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? "Processing..." : "Merge Audio"}
                  </button>
                  <button
                    disabled={!mergedAudioUrl || isProcessing}
                    onClick={() => download(mergedAudioUrl!, `merged.${outputFormat}`)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                  >
                    Download Result
                  </button>
                  <button
                    disabled={!loadedAudios.length || isProcessing}
                    onClick={clearAll}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg shadow disabled:cursor-not-allowed"
                  >
                    Clear All
                  </button>
                </div>

                {mergedAudioUrl && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">Merged Audio</h3>
                      <audio key={mergedAudioUrl} controls className="w-full mb-2">
                        <source src={mergedAudioUrl} type={`audio/${outputFormat}`} />
                      </audio>
                    </div>
                  </div>
                )}
              </div>
            </fieldset>
          </div>
        </div>
      </main>
    </>
  );
}
