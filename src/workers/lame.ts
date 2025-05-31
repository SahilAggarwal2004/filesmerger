self.importScripts("https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.all.js");

self.onmessage = function (e) {
  const { channelData, sampleRate, numberOfChannels, length, bitrateValue } = e.data;

  const encoder = new lamejs.Mp3Encoder(numberOfChannels, sampleRate, bitrateValue);
  const mp3Data = [];
  const chunkSize = 1152;
  let samplesProcessed = 0;

  while (samplesProcessed < length) {
    const currentChunkSize = Math.min(chunkSize, length - samplesProcessed);

    if (numberOfChannels === 1) {
      const monoBuffer = new Int16Array(currentChunkSize);
      const mono = channelData[0];

      for (let i = 0; i < currentChunkSize; i++) {
        monoBuffer[i] = Math.max(-32768, Math.min(32767, mono[samplesProcessed + i] * 32767));
      }

      const chunk = encoder.encodeBuffer(monoBuffer);
      if (chunk.length > 0) mp3Data.push(chunk);
    } else {
      const leftBuffer = new Int16Array(currentChunkSize);
      const rightBuffer = new Int16Array(currentChunkSize);
      const left = channelData[0];
      const right = channelData[1];

      for (let i = 0; i < currentChunkSize; i++) {
        leftBuffer[i] = Math.max(-32768, Math.min(32767, left[samplesProcessed + i] * 32767));
        rightBuffer[i] = Math.max(-32768, Math.min(32767, right[samplesProcessed + i] * 32767));
      }

      const chunk = encoder.encodeBuffer(leftBuffer, rightBuffer);
      if (chunk.length > 0) mp3Data.push(chunk);
    }

    samplesProcessed += currentChunkSize;
  }

  const finalChunk = encoder.flush();
  if (finalChunk.length > 0) mp3Data.push(finalChunk);

  const totalLength = mp3Data.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of mp3Data) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  self.postMessage(result.buffer, [result.buffer]);
};
