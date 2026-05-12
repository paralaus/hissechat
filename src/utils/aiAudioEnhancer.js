const AI_ENHANCER_TAG = '[AI-AUDIO]';

const getAudioContextCtor = () =>
  window.AudioContext || window.webkitAudioContext || null;

const buildProcessedAudioTrack = async (audioTrack) => {
  const AudioContextCtor = getAudioContextCtor();
  if (!AudioContextCtor || !audioTrack) return null;

  const ctx = new AudioContextCtor({ sampleRate: 48000 });
  const sourceStream = new MediaStream([audioTrack]);
  const source = ctx.createMediaStreamSource(sourceStream);

  // High-pass removes low-frequency hum (fan/handling noise).
  const highPass = ctx.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.value = 120;
  highPass.Q.value = 0.7;

  // Compressor improves speech consistency.
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 18;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.22;

  // Soft makeup gain for quieter speakers.
  const gain = ctx.createGain();
  gain.gain.value = 1.08;

  const destination = ctx.createMediaStreamDestination();
  source.connect(highPass);
  highPass.connect(compressor);
  compressor.connect(gain);
  gain.connect(destination);

  const processedTrack = destination.stream.getAudioTracks()[0] || null;
  if (processedTrack) {
    const cleanup = () => {
      try {
        if (ctx.state !== 'closed') ctx.close();
      } catch (_e) {
        // no-op
      }
    };
    audioTrack.addEventListener('ended', cleanup, { once: true });
    processedTrack.addEventListener('ended', cleanup, { once: true });
  }

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (_e) {
      // browser policy might require a user gesture; still usable in many cases
    }
  }

  return processedTrack;
};

const enhanceStream = async (inputStream) => {
  if (!inputStream) return inputStream;
  const audioTrack = inputStream.getAudioTracks?.()[0];
  if (!audioTrack) return inputStream;

  try {
    const processedTrack = await buildProcessedAudioTrack(audioTrack);
    if (!processedTrack) return inputStream;

    const output = new MediaStream();
    inputStream.getVideoTracks().forEach((track) => output.addTrack(track));
    output.addTrack(processedTrack);
    return output;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`${AI_ENHANCER_TAG} enhanceStream failed, using original stream`, err);
    return inputStream;
  }
};

if (typeof window !== 'undefined') {
  window.__AI_AUDIO_ENHANCER__ = {
    enhanceStream,
  };
}

export {};
