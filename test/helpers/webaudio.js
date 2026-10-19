/**
 * A stand-in for Web Audio that makes nothing and records what it is asked
 * for: every node a game builds, every parameter it sets.
 */
export function fakeAudio() {
  const log = [];
  const param = (name) => ({
    value: 0,
    setValueAtTime(v, t) { log.push([name, 'set', v, t]); return this; },
    linearRampToValueAtTime(v, t) { log.push([name, 'linear', v, t]); return this; },
    exponentialRampToValueAtTime(v, t) { log.push([name, 'exp', v, t]); return this; },
    setTargetAtTime(v, t, k) { log.push([name, 'target', v, t, k]); return this; },
    cancelScheduledValues() { return this; },
  });
  const node = (kind) => {
    const n = {
      kind,
      connect(to) { log.push([kind, 'connect', to?.kind]); return to; },
      disconnect() {},
      start(t) { log.push([kind, 'start', t]); },
      stop(t) { log.push([kind, 'stop', t]); },
    };
    for (const p of ['gain', 'frequency', 'Q', 'detune', 'delayTime', 'pan', 'threshold', 'knee', 'ratio', 'attack', 'release']) n[p] = param(`${kind}.${p}`);
    return n;
  };
  class FakeContext {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.state = 'running'; this.destination = node('destination'); }
    resume() {}
    close() {}
    createGain() { return node('gain'); }
    createOscillator() { return node('oscillator'); }
    createBiquadFilter() { return node('filter'); }
    createBufferSource() { return node('source'); }
    createDynamicsCompressor() { return node('compressor'); }
    createWaveShaper() { return node('shaper'); }
    createConvolver() { return node('convolver'); }
    createDelay() { return node('delay'); }
    createStereoPanner() { return node('panner'); }
    createAnalyser() { return node('analyser'); }
    createBuffer(channels, length) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { length, numberOfChannels: channels, getChannelData: (c) => data[c] };
    }
    createPeriodicWave() { return {}; }
  }
  return { FakeContext, log };
}

export const memoryStore = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k) };
};
