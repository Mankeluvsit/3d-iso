/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core types for the advanced metropolis visual engine.

export type WeatherType = 'clear' | 'overcast' | 'rain' | 'thunderstorm' | 'snow' | 'fog' | 'heatwave';
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';
export type OverlayType = 'none' | 'traffic' | 'pollution' | 'land_value' | 'utilities';
export type CameraStyle = 'default' | 'flyover' | 'photography' | 'cinematic';

export interface WeatherConfig {
  type: WeatherType;
  name: string;
  icon: string;
  skyColor: string;
  ambientIntensity: number;
  particlesDensity: number;
  windSpeed: number;
  speedMultiplier: number; // impact on traffic / citizen movement
  powerDemandMultiplier: number;
}

export interface SeasonConfig {
  type: SeasonType;
  name: string;
  icon: string;
  treeColor: string;
  skyTint: string;
  temperature: string;
  tourismMultiplier: number;
  utilityMultiplier: number;
}

export const WEATHERS: Record<WeatherType, WeatherConfig> = {
  clear: {
    type: 'clear',
    name: 'Sunny Clear Skies',
    icon: '☀️',
    skyColor: '#38bdf8',
    ambientIntensity: 0.65,
    particlesDensity: 0,
    windSpeed: 2,
    speedMultiplier: 1.0,
    powerDemandMultiplier: 1.0,
  },
  overcast: {
    type: 'overcast',
    name: 'Overcast Grey',
    icon: '☁️',
    skyColor: '#64748b',
    ambientIntensity: 0.45,
    particlesDensity: 0,
    windSpeed: 4,
    speedMultiplier: 0.9,
    powerDemandMultiplier: 1.1,
  },
  rain: {
    type: 'rain',
    name: 'Gentle Rainfall',
    icon: '🌧️',
    skyColor: '#475569',
    ambientIntensity: 0.35,
    particlesDensity: 120,
    windSpeed: 8,
    speedMultiplier: 0.7,
    powerDemandMultiplier: 1.25,
  },
  thunderstorm: {
    type: 'thunderstorm',
    name: 'Severe Thunderstorm',
    icon: '⛈️',
    skyColor: '#1e293b',
    ambientIntensity: 0.2,
    particlesDensity: 250,
    windSpeed: 15,
    speedMultiplier: 0.5,
    powerDemandMultiplier: 1.5,
  },
  snow: {
    type: 'snow',
    name: 'Powder Snowfall',
    icon: '❄️',
    skyColor: '#cbd5e1',
    ambientIntensity: 0.55,
    particlesDensity: 80,
    windSpeed: 5,
    speedMultiplier: 0.6,
    powerDemandMultiplier: 1.6,
  },
  fog: {
    type: 'fog',
    name: 'Dense Smog & Fog',
    icon: '🌫️',
    skyColor: '#475569',
    ambientIntensity: 0.3,
    particlesDensity: 0,
    windSpeed: 1,
    speedMultiplier: 0.5,
    powerDemandMultiplier: 1.2,
  },
  heatwave: {
    type: 'heatwave',
    name: 'Extreme Heatwave',
    icon: '🔥',
    skyColor: '#f97316',
    ambientIntensity: 0.75,
    particlesDensity: 0,
    windSpeed: 2,
    speedMultiplier: 0.85,
    powerDemandMultiplier: 1.8,
  },
};

export const SEASONS: Record<SeasonType, SeasonConfig> = {
  spring: {
    type: 'spring',
    name: 'Spring Blossom',
    icon: '🌸',
    treeColor: '#f472b6', // Cherry pink bloom
    skyTint: '#e0f2fe',
    temperature: '18°C',
    tourismMultiplier: 1.2,
    utilityMultiplier: 0.9,
  },
  summer: {
    type: 'summer',
    name: 'Summer Sun',
    icon: '🌻',
    treeColor: '#15803d', // Saturated deep emerald
    skyTint: '#fef08a',
    temperature: '29°C',
    tourismMultiplier: 1.5,
    utilityMultiplier: 1.3,
  },
  autumn: {
    type: 'autumn',
    name: 'Autumn Gold',
    icon: '🍁',
    treeColor: '#ca8a04', // Maple amber-yellow and crimson
    skyTint: '#ffedd5',
    temperature: '12°C',
    tourismMultiplier: 1.0,
    utilityMultiplier: 1.0,
  },
  winter: {
    type: 'winter',
    name: 'Winter Wonderland',
    icon: '☃️',
    treeColor: '#e2e8f0', // Snow frosted slate white
    skyTint: '#f1f5f9',
    temperature: '-3°C',
    tourismMultiplier: 0.8,
    utilityMultiplier: 1.7,
  },
};

// Procedural audio synthesizer class built using standard Web Audio APIs.
// No file downloads needed, completely dynamic, immersive, and custom tailored!
export class AdaptiveSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private trafficHum: OscillatorNode | null = null;
  private weatherNoise: AudioWorkletNode | ScriptProcessorNode | null = null;
  private weatherFilter: BiquadFilterNode | null = null;
  private weatherGain: GainNode | null = null;
  private sirensTone: OscillatorNode | null = null;

  private isStarted: boolean = false;

  constructor() {}

  public start() {
    if (this.isStarted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);

      this.initTrafficHum();
      this.initWeatherNoise();

      this.isStarted = true;
    } catch (e) {
      console.warn('Web Audio compilation failed or is blocked by browser interaction permissions', e);
    }
  }

  private initTrafficHum() {
    if (!this.ctx || !this.masterVolume) return;
    try {
      // Create low frequency deep city rumble
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(110, this.ctx.currentTime); // A2 note

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(90, this.ctx.currentTime); // Muffle high tones

      gain.gain.setValueAtTime(0.015, this.ctx.currentTime); // Soft hum

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterVolume);

      osc.start();
      osc2.start();

      this.trafficHum = osc;
    } catch (e) {
      console.warn('Hum creation failed', e);
    }
  }

  private initWeatherNoise() {
    if (!this.ctx || !this.masterVolume) return;
    try {
      // Use standard procedural ScriptProcessor representing white noise generator for rain/storm winds
      const bufferSize = 4096;
      const noiseNode = this.ctx.createScriptProcessor(bufferSize, 1, 1);
      noiseNode.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
      };

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0, this.ctx.currentTime); // Quiet by default

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterVolume);

      this.weatherNoise = noiseNode;
      this.weatherFilter = filter;
      this.weatherGain = gain;
    } catch (e) {
      console.warn('Noise creation failed', e);
    }
  }

  // Blends visual variables in real-time to adjust spatial acoustic hums
  public updateSoundscape(
    vol: number,
    weather: WeatherType,
    population: number,
    emergencyActive: boolean,
    zoomFactor: number // 0 (zoomed close) to 1 (zoomed far)
  ) {
    if (!this.ctx || !this.isStarted || !this.masterVolume) return;

    if (this.ctx.state === 'suspended') {
      return; // Browser pending resume interaction gesture
    }

    try {
      const now = this.ctx.currentTime;
      // Master volume scale
      this.masterVolume.gain.setTargetAtTime(vol * 0.45, now, 0.4);

      // Traffic scale
      if (this.trafficHum) {
        const targetFrequency = 45 + Math.min(population / 100, 20) + (1.0 - zoomFactor) * 15;
        this.trafficHum.frequency.setTargetAtTime(targetFrequency, now, 0.3);
      }

      // Weather rain wind sound mixing
      if (this.weatherGain && this.weatherFilter) {
        let noiseVol = 0.0;
        let cutFrequency = 400;
        let qValue = 1.0;

        if (weather === 'rain') {
          noiseVol = 0.08;
          cutFrequency = 800; // soft rain patters
          qValue = 0.7;
        } else if (weather === 'thunderstorm') {
          noiseVol = 0.16;
          cutFrequency = 250; // strong low howling wind
          qValue = 1.6;
        } else if (weather === 'snow') {
          noiseVol = 0.03;
          cutFrequency = 1500; // gentle snowflake friction
          qValue = 0.3;
        } else if (weather === 'overcast') {
          noiseVol = 0.01;
          cutFrequency = 300;
        }

        // Higher zoom = higher pitch of sky wind
        const adjustedCut = cutFrequency + zoomFactor * 250;

        this.weatherGain.gain.setTargetAtTime(noiseVol, now, 0.5);
        this.weatherFilter.frequency.setTargetAtTime(adjustedCut, now, 0.4);
        this.weatherFilter.Q.setTargetAtTime(qValue, now, 0.4);
      }

      // Play emergency fire sirens if an active disaster/fire is detected
      if (emergencyActive) {
        if (!this.sirensTone) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          gain.gain.setValueAtTime(0.008, now);

          // Siren wobble LFO
          const lfo = this.ctx.createOscillator();
          const lfoGain = this.ctx.createGain();
          lfo.frequency.setValueAtTime(2.0, now); // 2Hz shake
          lfoGain.gain.setValueAtTime(150, now); // wobble range +/- 150Hz

          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          osc.connect(gain);
          gain.connect(this.masterVolume);

          osc.start();
          lfo.start();
          this.sirensTone = osc;
        }
      } else {
        if (this.sirensTone) {
          try {
            this.sirensTone.stop();
          } catch (err) {}
          this.sirensTone = null;
        }
      }
    } catch (e) {
      console.warn('Sound update failed', e);
    }
  }

  public playDisasterStrike() {
    if (!this.ctx || !this.isStarted || !this.masterVolume) return;
    try {
      const now = this.ctx.currentTime;
      const strikeNoise = this.ctx.createOscillator();
      const strikeGain = this.ctx.createGain();

      strikeNoise.type = 'triangle';
      strikeNoise.frequency.setValueAtTime(100, now);
      strikeNoise.frequency.exponentialRampToValueAtTime(10, now + 1.2);

      strikeGain.gain.setValueAtTime(0.12, now);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      strikeNoise.connect(strikeGain);
      strikeGain.connect(this.masterVolume);

      strikeNoise.start();
      strikeNoise.stop(now + 1.3);
    } catch (err) {}
  }

  public playUpgradeDing() {
    if (!this.ctx || !this.isStarted || !this.masterVolume) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5 chord chime
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now); // E5 chord chime

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterVolume);

      osc.start();
      osc2.start();
      osc.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (err) {}
  }
}
