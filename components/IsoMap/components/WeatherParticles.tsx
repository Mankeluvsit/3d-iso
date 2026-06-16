import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WeatherType } from '../../../src/kernel/visual/VisualEngineState';
import { GRID_SIZE } from '../../../constants';

interface WeatherProps {
  weather: WeatherType;
  windSpeed: number;
}

export const WeatherParticles = ({ weather, windSpeed }: WeatherProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = weather === 'thunderstorm' ? 300 : weather === 'rain' ? 180 : weather === 'snow' ? 120 : 0;

  const [positions, speeds] = useMemo(() => {
    if (particleCount === 0) return [new Float32Array(0), new Float32Array(0)];
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * GRID_SIZE * 1.8;
      pos[i * 3 + 1] = Math.random() * 12 + 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * GRID_SIZE * 1.8;
      spd[i] = 1.8 + Math.random() * 2.2;
    }
    return [pos, spd];
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!pointsRef.current || particleCount === 0) return;
    const geo = pointsRef.current.geometry;
    const posArr = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
        // ... (as per original code, simplified for reuse) ...
        const idx = i * 3;
        const speed = speeds[i] * (weather === 'snow' ? 0.35 : 1.5) * 4.0 * delta;
        posArr[idx + 1] -= speed;
        posArr[idx + 0] += (windSpeed * 0.15) * delta;
        if (posArr[idx + 1] < -1.0) {
          posArr[idx + 1] = 13.0; // Reset height
          posArr[idx + 0] = (Math.random() - 0.5) * GRID_SIZE * 1.8;
          posArr[idx + 2] = (Math.random() - 0.5) * GRID_SIZE * 1.8;
        }
    }
    geo.attributes.position.needsUpdate = true;
  });

  if (particleCount === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        color={weather === 'snow' ? '#ffffff' : '#93c5fd'} 
        size={weather === 'snow' ? 0.15 : 0.08} 
      />
    </points>
  );
};
