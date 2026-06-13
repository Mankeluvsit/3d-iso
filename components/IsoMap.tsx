/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { MapControls, Environment, SoftShadows, Float, Outlines, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { Grid, BuildingType, TileData } from '../types';
import { GRID_SIZE, BUILDINGS } from '../constants';
import { WeatherType, SeasonType, OverlayType, WEATHERS, SEASONS } from '../src/kernel/visual/VisualEngineState';

// Fix for TypeScript not recognizing R3F elements in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// --- Coordinates & Helpers ---
const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0, y - WORLD_OFFSET] as [number, number, number];

// Hash utilities for stable seed-based procedural variance
const getHash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;

// Shared Geometries for GPU memory efficiency
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
const sphereGeo = new THREE.SphereGeometry(1, 8, 8);
const flatPlaneGeo = new THREE.PlaneGeometry(1, 1);

// --- Window Material Glow Helper ---
const WindowBlock = React.memo(({ position, scale, isNight, isBlackout }: { position: [number, number, number], scale: [number, number, number], isNight: boolean, isBlackout: boolean }) => {
  const glowing = isNight && !isBlackout;
  return (
    <mesh geometry={boxGeo} position={position} scale={scale}>
      <meshStandardMaterial 
        color={glowing ? '#fef08a' : '#bfdbfe'} 
        emissive={glowing ? '#fef08a' : '#1e3a8a'} 
        emissiveIntensity={glowing ? 1.5 : 0.15} 
        roughness={0.1} 
        metalness={0.9} 
      />
    </mesh>
  );
});

// --- Dynamic Particle Smoke Stack ---
const SmokeStackProps = ({ position, pollutionLevel }: { position: [number, number, number], pollutionLevel: number }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const cloud = child as THREE.Mesh;
        cloud.position.y += 0.015 + i * 0.003;
        cloud.scale.addScalar(0.006);
        
        // Tilt smoke due to wind drift simulation
        cloud.position.x += 0.003;

        const material = cloud.material as THREE.MeshStandardMaterial;
        if (material) {
          material.opacity -= 0.006;
          if (cloud.position.y > 1.8) {
            cloud.position.y = 0;
            cloud.position.x = 0;
            cloud.scale.setScalar(0.08 + Math.random() * 0.08);
            material.opacity = 0.7;
          }
        }
      });
    }
  });

  // Darker emissions represent high pollution index
  const smokeColor = pollutionLevel > 50 ? '#4b5563' : '#cbd5e1';

  return (
    <group position={position}>
      <mesh geometry={cylinderGeo} position={[0, 0.4, 0]} scale={[0.15, 0.8, 0.15]} castShadow>
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>
      <group ref={ref} position={[0, 0.8, 0]}>
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} geometry={sphereGeo} position={[0, i * 0.3, 0]} scale={0.12}>
            <meshStandardMaterial color={smokeColor} flatShading roughness={1.0} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// --- Weather Dust Overlay component ---
const WeatherParticles = ({ weather, windSpeed }: { weather: WeatherType, windSpeed: number }) => {
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
      const idx = i * 3;
      // Drop fall rate
      const speed = speeds[i] * (weather === 'snow' ? 0.35 : 1.5) * 4.0 * delta;
      posArr[idx + 1] -= speed; // Vertical drop
      posArr[idx + 0] += (windSpeed * 0.15) * delta; // Wind drift

      // Recycle boundary warp
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

// --- Active Scaffolding / Construction model ---
const ConstructionBuilding = ({ height }: { height: number }) => {
  const progressMeshRef = useRef<THREE.Mesh>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (progressMeshRef.current) {
      // Assemble lifting animation
      progressMeshRef.current.position.y = -0.3 + Math.sin(time) * 0.05;
    }
    if (flashLightRef.current) {
      // Flashes high-intensity yellow hazard light representation
      flashLightRef.current.intensity = Math.sin(time * 8) > 0 ? 2 : 0;
    }
  });

  return (
    <group>
      {/* Wooden skeletal foundation platform */}
      <mesh geometry={boxGeo} scale={[0.88, 0.08, 0.88]} position={[0, -0.28, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#d97706" roughness={1} />
      </mesh>
      {/* Rusty industrial scaffolding pillars */}
      <mesh geometry={cylinderGeo} scale={[0.06, height, 0.06]} position={[0.35, height / 2 - 0.3, 0.35]} castShadow>
        <meshStandardMaterial color="#4b5563" metalness={0.9} />
      </mesh>
      <mesh geometry={cylinderGeo} scale={[0.06, height, 0.06]} position={[-0.35, height / 2 - 0.3, 0.35]} castShadow>
        <meshStandardMaterial color="#4b5563" metalness={0.9} />
      </mesh>
      <mesh geometry={cylinderGeo} scale={[0.06, height, 0.06]} position={[0.35, height / 2 - 0.3, -0.35]} castShadow>
        <meshStandardMaterial color="#4b5563" metalness={0.9} />
      </mesh>
      <mesh geometry={cylinderGeo} scale={[0.06, height, 0.06]} position={[-0.35, height / 2 - 0.3, -0.35]} castShadow>
        <meshStandardMaterial color="#4b5563" metalness={0.9} />
      </mesh>
      {/* Warning safety mesh sheets - Fully opaque wireframe */}
      <mesh geometry={boxGeo} scale={[0.78, height * 0.8, 0.78]} position={[0, height / 2 - 0.3, 0]}>
        <meshStandardMaterial color="#eab308" wireframe />
      </mesh>
      {/* Warning safety point beacon */}
      <pointLight ref={flashLightRef} color="#eab308" distance={3} position={[0, height - 0.1, 0]} />
      <mesh geometry={sphereGeo} scale={0.08} position={[0, height - 0.2, 0]}>
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
};

// --- Fire Disaster visual particles ---
const FireDisasterVFX = ({ position }: { position: [number, number, number] }) => {
  const fireGroupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (fireGroupRef.current) {
      const time = state.clock.getElapsedTime();
      fireGroupRef.current.children.forEach((child, i) => {
        const flame = child as THREE.Mesh;
        flame.position.y += 0.02 + Math.sin(time + i) * 0.01;
        flame.scale.setScalar(Math.max(0.01, flame.scale.x - 0.005));
        
        const mat = flame.material as THREE.MeshBasicMaterial;
        if(flame.position.y > 0.8) {
          flame.position.y = 0.2;
          flame.position.x = (Math.random() - 0.5) * 0.4;
          flame.position.z = (Math.random() - 0.5) * 0.4;
          flame.scale.setScalar(0.12 + Math.random() * 0.15);
        }
      });
    }
  });

  return (
    <group position={position}>
      <group ref={fireGroupRef}>
        {[0, 1, 2, 3, 4].map(i => (
          <mesh key={i} geometry={sphereGeo} position={[(Math.random()-0.5)*0.3, 0.2, (Math.random()-0.5)*0.3]} scale={0.2}>
            <meshBasicMaterial color={i % 2 === 0 ? '#ef4444' : '#f97316'} />
          </mesh>
        ))}
      </group>
      {/* Glowing point source of fire incident */}
      <pointLight color="#f97316" intensity={3.0} distance={5.0} position={[0, 0.4, 0]} />
    </group>
  );
};

// --- Comprehensive Procedural Architecture & Districts ---
interface BuildingStyles {
  type: BuildingType;
  baseColor: string;
  x: number;
  y: number;
  isNight: boolean;
  isBlackout: boolean;
  activeOverlay: OverlayType;
  season: SeasonType;
  averageHappiness: number;
  pollutionLevel: number;
}

const ProceduralBuilding = React.memo(({ 
  type, 
  baseColor, 
  x, 
  y, 
  isNight, 
  isBlackout, 
  activeOverlay, 
  season, 
  averageHappiness,
  pollutionLevel 
}: BuildingStyles) => {
  const hash = getHash(x, y);
  const variant = Math.floor(hash * 100);
  const rotation = Math.floor(hash * 4) * (Math.PI / 2);

  const isUnderConstruction = hash > 0.85; // Deterministic 15% rate of dynamic active renovation progress

  // Quality check: Urban decay on neglected areas with low social happiness
  const isDecaying = averageHappiness < 45 && hash > 0.4;

  // Custom textures colors based on season & zoning districts
  const color = useMemo(() => {
    let c = new THREE.Color(baseColor);
    
    // Industrial District styling
    if (type === BuildingType.Industrial) {
      c = new THREE.Color('#475569'); // Gritty charcoal
    }
    // Deep neon contrast under night systems
    if (isNight && type === BuildingType.Commercial) {
      // Indigo glow accent hue shifts
      c = c.lerp(new THREE.Color('#312e81'), 0.25);
    }
    return c;
  }, [baseColor, isNight, type]);

  const mainMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color, 
    flatShading: true, 
    roughness: isDecaying ? 1.0 : 0.4, 
    metalness: type === BuildingType.Commercial ? 0.8 : 0.2 
  }), [color, isDecaying, type]);

  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color).multiplyScalar(0.7), 
    flatShading: true 
  }), [color]);

  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color).multiplyScalar(0.4), 
    flatShading: true 
  }), [color]);

  // Snowcaps for buildings roof in Winter
  const snowCapMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#ffffff', 
    roughness: 0.9 
  }), []);

  if (isUnderConstruction) {
    return <ConstructionBuilding height={1.2 + hash * 1.0} />;
  }

  // Position building cleanly on top of its respective procedural terrain height
  const yOffset = getTileHeight(x, y);

  return (
    <group rotation={[0, rotation, 0]} position={[0, yOffset, 0]}>
      {(() => {
        switch (type) {
          case BuildingType.Residential:
            // "Greenwood Suburbia" styling
            if (variant < 40) {
              // Standard Cottage
              return (
                <>
                  <mesh castShadow receiveShadow material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.7, 0.6, 0.6]} />
                  <mesh castShadow receiveShadow material={roofMat} geometry={coneGeo} position={[0, 0.75, 0]} scale={[0.62, 0.4, 0.62]} rotation={[0, Math.PI / 4, 0]} />
                  <WindowBlock position={[0.2, 0.3, 0.31]} scale={[0.15, 0.2, 0.05]} isNight={isNight} isBlackout={isBlackout} />
                  <WindowBlock position={[-0.2, 0.3, 0.31]} scale={[0.15, 0.2, 0.05]} isNight={isNight} isBlackout={isBlackout} />
                  {season === 'winter' && (
                    <mesh geometry={boxGeo} scale={[0.65, 0.05, 0.65]} position={[0, 0.62, 0]} material={snowCapMat} />
                  )}
                </>
              );
            } else if (variant < 80) {
              // Modern Bento Condos
              return (
                <>
                  <mesh castShadow receiveShadow material={mainMat} geometry={boxGeo} position={[-0.1, 0.38, 0]} scale={[0.6, 0.76, 0.8]} />
                  <mesh castShadow receiveShadow material={accentMat} geometry={boxGeo} position={[0.24, 0.24, 0.1]} scale={[0.42, 0.48, 0.6]} />
                  <WindowBlock position={[-0.1, 0.52, 0.41]} scale={[0.4, 0.2, 0.05]} isNight={isNight} isBlackout={isBlackout} />
                  <WindowBlock position={[0.24, 0.32, 0.41]} scale={[0.2, 0.25, 0.05]} isNight={isNight} isBlackout={isBlackout} />
                  {season === 'winter' && (
                    <mesh geometry={boxGeo} scale={[0.62, 0.03, 0.82]} position={[-0.1, 0.77, 0]} material={snowCapMat} />
                  )}
                </>
              );
            } else {
              // Classic Red-brick Townhouse (preserving historical growth context)
              const brickMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.95 });
              return (
                <>
                  <mesh castShadow receiveShadow material={brickMat} geometry={boxGeo} position={[0, 0.5, 0]} scale={[0.55, 1.0, 0.65]} />
                  <mesh castShadow receiveShadow material={roofMat} geometry={boxGeo} position={[0, 1.04, 0]} scale={[0.6, 0.08, 0.7]} />
                  <WindowBlock position={[0, 0.72, 0.33]} scale={[0.26, 0.2, 0.05]} isNight={isNight} isBlackout={isBlackout} />
                  <WindowBlock position={[0, 0.32, 0.33]} scale={[0.26, 0.2, 0.05]} isNight={isNight} isBlackout={isBlackout} />
                </>
              );
            }

          case BuildingType.Commercial:
            // "Neon Financial District" styling
            if (variant < 50) {
              // Glass skyscraper
              const height = 1.6 + hash * 1.8;
              const levelCount = Math.floor(height * 3.5);
              return (
                <>
                  <mesh castShadow receiveShadow material={mainMat} geometry={boxGeo} position={[0, height / 2, 0]} scale={[0.72, height, 0.72]} />
                  {Array.from({ length: levelCount }).map((_, i) => (
                    <WindowBlock 
                      key={i} 
                      position={[0, 0.2 + i * 0.28, 0]} 
                      scale={[0.74, 0.12, 0.74]} 
                      isNight={isNight} 
                      isBlackout={isBlackout} 
                    />
                  ))}
                  {/* Spectacular glowing Neon signs around Financial skyscraper crown */}
                  {isNight && !isBlackout && (
                    <mesh geometry={boxGeo} position={[0, height + 0.1, 0]} scale={[0.52, 0.15, 0.52]}>
                      <meshBasicMaterial color={hash > 0.5 ? '#ec4899' : '#06b6d4'} />
                    </mesh>
                  )}
                  {/* Metal antenna / lightning rod spikes */}
                  <mesh geometry={cylinderGeo} scale={[0.02, 0.6, 0.02]} position={[0, height + 0.3, 0]} />
                </>
              );
            } else {
              // Compact Shopping Plaza
              return (
                <>
                  <mesh castShadow receiveShadow material={mainMat} geometry={boxGeo} position={[0, 0.45, 0]} scale={[0.85, 0.9, 0.85]} />
                  <WindowBlock position={[0, 0.35, 0.43]} scale={[0.7, 0.35, 0.05]} isNight={isNight} isBlackout={isBlackout} />
                  {/* Decorative glowing canopy roof sign */}
                  <mesh geometry={boxGeo} position={[0, 0.62, 0.45]} scale={[0.9, 0.12, 0.18]} rotation={[Math.PI / 8, 0, 0]}>
                    <meshStandardMaterial color={hash > 0.5 ? '#10b981' : '#f59e0b'} emissive={isNight && !isBlackout ? '#f59e0b' : '#000000'} />
                  </mesh>
                </>
              );
            }

          case BuildingType.Industrial:
            // "Apex Heavy Smelt-works" styling
            if (variant < 50) {
              // Steel foundry
              return (
                <>
                  <mesh castShadow receiveShadow material={mainMat} geometry={boxGeo} position={[0, 0.45, 0]} scale={[0.88, 0.9, 0.88]} />
                  {/* Roof vents */}
                  <mesh castShadow receiveShadow material={roofMat} geometry={boxGeo} position={[-0.2, 0.95, 0]} scale={[0.3, 0.2, 0.8]} rotation={[0, 0, Math.PI / 4]} />
                  <mesh castShadow receiveShadow material={roofMat} geometry={boxGeo} position={[0.2, 0.95, 0]} scale={[0.3, 0.2, 0.8]} rotation={[0, 0, Math.PI / 4]} />
                  <SmokeStackProps position={[0.24, 0.45, 0.24]} pollutionLevel={pollutionLevel} />
                </>
              );
            } else {
              // Corrugated warehouse storage
              return (
                <>
                  <mesh castShadow receiveShadow material={mainMat} geometry={boxGeo} position={[-0.2, 0.35, 0]} scale={[0.5, 0.7, 0.88]} />
                  <mesh castShadow receiveShadow material={accentMat} geometry={cylinderGeo} position={[0.24, 0.45, -0.24]} scale={[0.2, 0.9, 0.2]} />
                  <mesh castShadow receiveShadow material={accentMat} geometry={cylinderGeo} position={[0.24, 0.45, 0.24]} scale={[0.2, 0.9, 0.2]} />
                </>
              );
            }

          case BuildingType.Park:
            // "Botanical Sanctuary Eco-Gardens" styling
            const positions = [[-0.24, -0.24], [0.24, 0.24], [-0.24, 0.24], [0.24, -0.24]];
            const treeCount = 2 + Math.floor(hash * 2);
            const activeTreeColor = SEASONS[season].treeColor;

            return (
              <group position={[0, -yOffset - 0.28, 0]}>
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
                  <planeGeometry args={[0.9, 0.9]} />
                  <meshStandardMaterial color={season === 'winter' ? '#f8fafc' : '#86efac'} roughness={1.0} />
                </mesh>

                {/* Central architectural Fountain pool */}
                {variant < 40 && (
                  <group position={[0, 0.05, 0]}>
                    <mesh material={new THREE.MeshStandardMaterial({ color: '#cbd5e1' })} geometry={cylinderGeo} scale={[0.35, 0.08, 0.35]} castShadow />
                    <mesh material={new THREE.MeshStandardMaterial({ color: '#0ea5e9', roughness: 0.1, metalness: 0.8 })} geometry={cylinderGeo} position={[0, 0.05, 0]} scale={[0.28, 0.04, 0.28]} />
                  </group>
                )}

                {/* Contextual detailed park benches */}
                {variant >= 40 && (
                  <mesh geometry={boxGeo} scale={[0.3, 0.1, 0.1]} position={[0, 0.06, 0]} castShadow>
                    <meshStandardMaterial color="#78350f" />
                  </mesh>
                )}

                {/* Season-aware blooming vegetation trees */}
                {Array.from({ length: treeCount }).map((_, i) => {
                  const pos = positions[i % positions.length];
                  const scale = 0.4 + getHash(x + i, y - i) * 0.4;
                  return (
                    <group key={i} position={[pos[0], 0, pos[1]]} scale={scale}>
                      <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: '#7c2d12' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.08, 0.3, 0.08]} />
                      <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: activeTreeColor, flatShading: true, roughness: 0.9 })} geometry={coneGeo} position={[0, 0.42, 0]} scale={[0.38, 0.5, 0.38]} />
                      <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: activeTreeColor, flatShading: true, roughness: 0.9 })} geometry={coneGeo} position={[0, 0.65, 0]} scale={[0.28, 0.4, 0.28]} />
                    </group>
                  );
                })}
              </group>
            );

          default:
            return null;
        }
      })()}
    </group>
  );
});

// --- Dynamic Vehicles & congestion flow representation ---
interface TrafficProps {
  grid: Grid;
  isNight: boolean;
  isBlackout: boolean;
  activeOverlay: OverlayType;
}

const TrafficSystem = ({ grid, isNight, isBlackout, activeOverlay }: TrafficProps) => {
  const roadTiles = useMemo(() => {
    const roads: { x: number, y: number }[] = [];
    grid.forEach(row => row.forEach(tile => {
      if (tile.buildingType === BuildingType.Road) roads.push({ x: tile.x, y: tile.y });
    }));
    return roads;
  }, [grid]);

  // Adjust cars dynamically relative to road counts
  const carCount = Math.min(roadTiles.length * 1.5, 35);
  const carsRef = useRef<THREE.InstancedMesh>(null);
  const carsState = useRef<Float32Array>(new Float32Array(0)); 
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Track serialized state of roads to prevent annoying resets when simulation updates non-road components
  const prevRoadsRef = useRef<string>('');

  useEffect(() => {
    if (roadTiles.length < 2) return;

    const currentSerialized = roadTiles.map(t => `${t.x},${t.y}`).join(';');
    if (currentSerialized === prevRoadsRef.current && carsState.current.length === carCount * 7) {
      return; // Skip resetting if the road network geometry is unchanged
    }
    prevRoadsRef.current = currentSerialized;

    carsState.current = new Float32Array(carCount * 7); // [curX, curY, tarX, tarY, progress, speed, colorIndex]
    const carColors = ['#ef4444', '#3b82f6', '#eab308', '#f8fafc', '#1e293b', '#a855f7'];
    const newColors = new Float32Array(carCount * 3);

    for (let i = 0; i < carCount; i++) {
      const idx = i * 7;
      const startNode = roadTiles[Math.floor(Math.random() * roadTiles.length)];
      carsState.current[idx + 0] = startNode.x;
      carsState.current[idx + 1] = startNode.y;
      carsState.current[idx + 2] = startNode.x;
      carsState.current[idx + 3] = startNode.y;
      carsState.current[idx + 4] = 1.0; // trigger pick
      carsState.current[idx + 5] = 0.015 + Math.random() * 0.015;

      const randomColorIndex = Math.floor(Math.random() * carColors.length);
      carsState.current[idx + 6] = randomColorIndex;
      const color = new THREE.Color(carColors[randomColorIndex]);
      newColors[i * 3 + 0] = color.r;
      newColors[i * 3 + 1] = color.g;
      newColors[i * 3 + 2] = color.b;
    }

    if (carsRef.current) {
      carsRef.current.instanceColor = new THREE.InstancedBufferAttribute(newColors, 3);
    }
  }, [roadTiles, carCount]);

  useFrame(() => {
    if (!carsRef.current || roadTiles.length < 2 || carsState.current.length === 0) return;

    for (let i = 0; i < carCount; i++) {
      const idx = i * 7;
      let curX = carsState.current[idx + 0];
      let curY = carsState.current[idx + 1];
      let tarX = carsState.current[idx + 2];
      let tarY = carsState.current[idx + 3];
      let progress = carsState.current[idx + 4];
      const speed = carsState.current[idx + 5];

      progress += speed;

      if (progress >= 1.0) {
        curX = tarX;
        curY = tarY;
        progress = 0;

        const neighbors = roadTiles.filter(t => 
          (Math.abs(t.x - curX) === 1 && t.y === curY) || 
          (Math.abs(t.y - curY) === 1 && t.x === curX)
        );

        if (neighbors.length > 0) {
          const next = neighbors[Math.floor(Math.random() * neighbors.length)];
          tarX = next.x;
          tarY = next.y;
        } else {
          const randomNode = roadTiles[Math.floor(Math.random() * roadTiles.length)];
          curX = randomNode.x; curY = randomNode.y; tarX = randomNode.x; tarY = randomNode.y;
        }
      }

      carsState.current[idx + 0] = curX;
      carsState.current[idx + 1] = curY;
      carsState.current[idx + 2] = tarX;
      carsState.current[idx + 3] = tarY;
      carsState.current[idx + 4] = progress;

      const gx = MathUtils.lerp(curX, tarX, progress);
      const gy = MathUtils.lerp(curY, tarY, progress);

      const dx = tarX - curX;
      const dy = tarY - curY;
      const angle = Math.atan2(dy, dx);
      
      const offsetAmt = 0.16;
      const len = Math.sqrt(dx * dx + dy * dy) || 1.0;
      const offX = (-dy / len) * offsetAmt;
      const offY = (dx / len) * offsetAmt;

      const [wx, _, wz] = gridToWorld(gx + offX, gy + offY);

      // Interpolate driving elevation correctly matching road heights of rolling hills 3D terrain
      const curH = getTileHeight(curX, curY);
      const tarH = getTileHeight(tarX, tarY);
      const h = MathUtils.lerp(curH, tarH, progress);

      dummy.position.set(wx, h + 0.08, wz);
      dummy.rotation.set(0, -angle, 0);
      dummy.scale.set(0.38, 0.11, 0.22); 
      dummy.updateMatrix();

      carsRef.current.setMatrixAt(i, dummy.matrix);
    }
    carsRef.current.instanceMatrix.needsUpdate = true;
  });

  if (roadTiles.length < 2) return null;

  return (
    <group>
      <instancedMesh ref={carsRef} args={[boxGeo, undefined, carCount]} castShadow>
        <meshStandardMaterial roughness={0.2} metalness={0.8} />
      </instancedMesh>
    </group>
  );
};

// --- Dynamic Walking Citizens component ---
interface PopulationProps {
  population: number;
  grid: Grid;
  weather: WeatherType;
  season: SeasonType;
}

const PopulationSystem = ({ population, grid, weather, season }: PopulationProps) => {
  const agentCount = Math.min(Math.floor(population * 0.45 + 5), 45); 
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const umbrellaRef = useRef<THREE.InstancedMesh>(null);

  const walkableTiles = useMemo(() => {
    const tiles: { x: number, y: number }[] = [];
    grid.forEach(row => row.forEach(tile => {
      if (tile.buildingType === BuildingType.Road || tile.buildingType === BuildingType.Park || tile.buildingType === BuildingType.None) {
        tiles.push({ x: tile.x, y: tile.y });
      }
    }));
    return tiles;
  }, [grid]);

  const agentsState = useRef<Float32Array>(new Float32Array(0));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const umbrellaDummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (agentCount === 0 || walkableTiles.length === 0) return;
    agentsState.current = new Float32Array(agentCount * 6);
    const newColors = new Float32Array(agentCount * 3);

    for (let i = 0; i < agentCount; i++) {
      const t = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
      agentsState.current[i * 6 + 0] = t.x + getRandomRange(-0.35, 0.35);
      agentsState.current[i * 6 + 1] = t.y + getRandomRange(-0.35, 0.35);
      
      const target = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
      agentsState.current[i * 6 + 2] = target.x + getRandomRange(-0.35, 0.35);
      agentsState.current[i * 6 + 3] = target.y + getRandomRange(-0.35, 0.35);
      
      agentsState.current[i * 6 + 4] = 0.006 + Math.random() * 0.008;
      agentsState.current[i * 6 + 5] = Math.random() * Math.PI * 2;

      const randomColor = new THREE.Color(getRandomClothesColor());
      newColors[i * 3 + 0] = randomColor.r;
      newColors[i * 3 + 1] = randomColor.g;
      newColors[i * 3 + 2] = randomColor.b;
    }

    if (meshRef.current) {
      meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(newColors, 3);
    }
  }, [agentCount, walkableTiles]);

  useFrame((state) => {
    if (!meshRef.current || agentCount === 0 || agentsState.current.length === 0) return;
    const time = state.clock.elapsedTime;

    const isRaining = weather === 'rain' || weather === 'thunderstorm';

    for (let i = 0; i < agentCount; i++) {
      const idx = i * 6;
      let x = agentsState.current[idx + 0];
      let y = agentsState.current[idx + 1];
      let tx = agentsState.current[idx + 2];
      let ty = agentsState.current[idx + 3];
      const speed = agentsState.current[idx + 4] * (season === 'winter' ? 0.7 : 1.0); // slower commutes in snow
      const animOffset = agentsState.current[idx + 5];

      const dx = tx - x;
      const dy = ty - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.12) {
        if (walkableTiles.length > 0) {
          const target = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
          tx = target.x + getRandomRange(-0.35, 0.35);
          ty = target.y + getRandomRange(-0.35, 0.35);
          agentsState.current[idx + 2] = tx;
          agentsState.current[idx + 3] = ty;
        }
      } else {
        x += (dx / dist) * speed;
        y += (dy / dist) * speed;
        agentsState.current[idx + 0] = x;
        agentsState.current[idx + 1] = y;
      }

      const [wx, _, wz] = gridToWorld(x, y);
      const bounce = Math.abs(Math.sin(time * 12 + animOffset)) * 0.024;

      // Ground walker anchored smoothly to 3D terrain elevation
      const h = getTileHeight(Math.round(x), Math.round(y));

      dummy.position.set(wx, h - 0.02 + bounce, wz);
      dummy.rotation.set(0, -Math.atan2(dy, dx), 0);
      dummy.scale.set(0.065, 0.15, 0.065);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Render colorful Umbrellas during rain/storms
      if (umbrellaRef.current) {
        if (isRaining) {
          umbrellaDummy.position.set(wx, h + 0.14 + bounce, wz);
          umbrellaDummy.scale.set(0.35, 0.05, 0.35);
          umbrellaDummy.rotation.set(0, i, 0);
          umbrellaDummy.updateMatrix();
          umbrellaRef.current.setMatrixAt(i, umbrellaDummy.matrix);
        } else {
          // Hide under ground platform
          umbrellaDummy.position.set(0, -10, 0);
          umbrellaDummy.scale.setScalar(0.001);
          umbrellaDummy.updateMatrix();
          umbrellaRef.current.setMatrixAt(i, umbrellaDummy.matrix);
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (umbrellaRef.current) {
      umbrellaRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (agentCount === 0) return null;

  return (
    <group>
      <instancedMesh ref={meshRef} args={[boxGeo, undefined, agentCount]} castShadow>
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={umbrellaRef} args={[coneGeo, undefined, agentCount]} castShadow>
        <meshStandardMaterial color="#3b82f6" roughness={0.1} flatShading />
      </instancedMesh>
    </group>
  );
};

const getRandomClothesColor = () => {
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#e2e8f0', '#06b6d4'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getRandomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// --- Advanced Meandering River component ---
// Coordinates representing a beautiful river flowing diagonally
const isRiverCell = (x: number, y: number) => {
  // Sinusoidal meandering trail slicing the 15x15 metropolis map
  const pathCenter = 7 + Math.sin(y * 0.4) * 2;
  return Math.abs(x - pathCenter) < 1.1;
};

// Procedural heightmap generator using stable trigonometric waveforms (simulating noise)
// Ensures clean, smooth hills and peaks across the map without boundary seams
const getTileHeight = (x: number, y: number) => {
  if (isRiverCell(x, y)) {
    return -0.42; // low elevation valley bed for the river
  }
  
  // Clean multi-frequency harmonic heightmap sampling to avoid chunk boundaries and seams
  const freq1 = 0.25;
  const freq2 = 0.55;
  const h1 = Math.sin(x * freq1) * Math.cos(y * freq1) * 0.55; // primary rolling hills
  const h2 = Math.sin(x * freq2 + 2.0) * Math.cos(y * freq2 + 1.0) * 0.18; // secondary terrain ripples
  
  return h1 + h2;
};

const WaterRiverMesh = ({ x, y, pollutionLevel }: { x: number, y: number, pollutionLevel: number }) => {
  const [wx, _, wz] = gridToWorld(x, y);
  const waveRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (waveRef.current) {
      const time = state.clock.getElapsedTime();
      // Wave water vertical drift
      waveRef.current.position.y = -0.32 + Math.sin(time * 2.0 + x * 0.5 + y * 0.5) * 0.012;
    }
  });

  // Green polluted water tint vs clean azure turquoise
  const waterColor = useMemo(() => {
    const clean = new THREE.Color('#0ea5e9');
    const toxic = new THREE.Color('#4d7c0f'); // murky slime swamp green
    const factor = Math.min(pollutionLevel / 100, 1.0);
    return clean.clone().lerp(toxic, factor);
  }, [pollutionLevel]);

  return (
    <mesh ref={waveRef} position={[wx, -0.32, wz]} receiveShadow>
      <boxGeometry args={[1, 0.4, 1]} />
      <meshStandardMaterial color={waterColor} roughness={0.08} metalness={0.9} />
    </mesh>
  );
};

// --- Scenic Ground tile with Analytical Indicators & Decals ---
interface TileProps {
  tile: TileData;
  grid: Grid;
  activeOverlay: OverlayType;
  averageHappiness: number;
  pollutionLevel: number;
  season: SeasonType;
  onHover: (x: number, y: number) => void;
  onLeave: () => void;
  onClick: (x: number, y: number) => void;
}

const GroundTile = React.memo(({ 
  tile, 
  grid, 
  activeOverlay, 
  averageHappiness,
  pollutionLevel,
  season, 
  onHover, 
  onLeave, 
  onClick 
}: TileProps) => {
  const { x, y, buildingType } = tile;
  const [wx, _, wz] = gridToWorld(x, y);
  
  const hash = getHash(x, y);

  // Overlay Heatmap colors mapping
  const tileColor = useMemo(() => {
    if (activeOverlay === 'utilities') {
      const supplied = buildingType === BuildingType.Residential || buildingType === BuildingType.Commercial 
        ? hash > 0.15 
        : true;
      return supplied ? '#06b6d4' : '#f43f5e';
    }

    if (activeOverlay === 'land_value') {
      // Proximity mock thermal heatmap based on park structures
      const distToPark = 5; // simplified logic
      if (buildingType === BuildingType.Park) return '#dc2626'; // Ultra hot
      if (buildingType === BuildingType.Commercial) return '#f97316';
      if (buildingType === BuildingType.Residential) return '#eab308';
      return '#3b82f6'; // Cold
    }

    if (activeOverlay === 'pollution') {
      if (buildingType === BuildingType.Industrial) return '#a855f7'; // Toxic purple
      return hash > 0.6 ? '#c084fc' : '#1e1b4b';
    }

    if (activeOverlay === 'traffic') {
      if (buildingType === BuildingType.Road) {
        return hash > 0.72 ? '#ef4444' : hash > 0.45 ? '#f59e0b' : '#10b981';
      }
    }

    // Default physical theme colored materials
    if (buildingType === BuildingType.Road) {
      return '#334155'; // Dark tarmac slate
    }

    if (buildingType === BuildingType.None) {
      if (isRiverCell(x, y)) {
        return '#0284c7';
      }
      // Season-aware terrain maps
      if (season === 'winter') {
        return '#f1f5f9'; // Soft fluffy snow
      }
      if (season === 'autumn') {
        return '#78350f'; // Maple brown forest floor
      }
      return hash > 0.6 ? '#15803d' : '#166534'; // Lush green forest
    }

    return '#475569'; // Grey concrete foundation slab
  }, [activeOverlay, buildingType, season, x, y, hash]);

  // Dynamically sample the procedural height coordinate for the tile
  const h = getTileHeight(x, y);
  const bottomY = -1.2; // stable deep bedrock foundation level for columns
  const thickness = h - bottomY;
  const centerY = bottomY + thickness / 2;

  // Slower performance paths bypass water meshes for river logic
  if (buildingType === BuildingType.None && isRiverCell(x, y) && activeOverlay === 'none') {
    return <WaterRiverMesh x={x} y={y} pollutionLevel={pollutionLevel} />;
  }

  return (
    <mesh 
      position={[wx, centerY, wz]} 
      receiveShadow castShadow
      onPointerEnter={(e) => { e.stopPropagation(); onHover(x, y); }}
      onPointerOut={(e) => { e.stopPropagation(); onLeave(); }}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.button === 0) onClick(x, y);
      }}
    >
      <boxGeometry args={[1.0, thickness, 1.0]} />
      <meshStandardMaterial color={tileColor} roughness={0.9} flatShading />
    </mesh>
  );
});

// Selection/Hover Cursor
const Cursor = ({ x, y, color }: { x: number, y: number, color: string }) => {
  const [wx, _, wz] = gridToWorld(x, y);
  const h = getTileHeight(x, y);
  return (
    <mesh position={[wx, h + 0.04, wz]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <planeGeometry args={[0.98, 0.98]} />
      <meshBasicMaterial color={color} side={THREE.DoubleSide} depthTest={false} />
      <Outlines thickness={0.06} color="white" />
    </mesh>
  );
};

// --- Photographic Filter controls overlay wrapper component ---
const PhotoFilterOverlay = ({ filter }: { filter: string }) => {
  const { gl } = useThree();

  useEffect(() => {
    // Dynamic grading adjustments on Three context renderer directly!
    if (!gl) return;
    if (filter === 'vintage') {
      gl.toneMappingExposure = 1.25;
    } else if (filter === 'thermal') {
      gl.toneMappingExposure = 0.8;
    } else if (filter === 'blueprint') {
      gl.toneMappingExposure = 1.5;
    } else {
      gl.toneMappingExposure = 1.0;
    }
  }, [filter, gl]);

  return null;
};

// --- Unified Camera Flyover Orbit helper ---
const CinematicCameraEngine = ({ active, style }: { active: boolean, style: CameraStyle }) => {
  useFrame((state) => {
    if (!active && style === 'default') return;
    if (style === 'flyover' || active) {
      const time = state.clock.getElapsedTime() * 0.18;
      // Orbit camera in gorgeous continuous sweeping arcs
      state.camera.position.x = Math.sin(time) * 22 + 10;
      state.camera.position.z = Math.cos(time) * 22 + 10;
      state.camera.lookAt(0, -0.5, 0);
    }
  });

  return null;
};

interface IsoMapProps {
  grid: Grid;
  onTileClick: (x: number, y: number) => void;
  hoveredTool: BuildingType;
  population: number;
  timeOfDay: number;
  weather: WeatherType;
  season: SeasonType;
  activeOverlay: OverlayType;
  isBlackout: boolean;
  isCinemaActive: boolean;
  activeDisasters: { x: number, y: number, type: string }[];
  photoFilter: string;
  averageHappiness: number;
  congestionLevel: number;
}

const IsoMap: React.FC<IsoMapProps> = ({ 
  grid, 
  onTileClick, 
  hoveredTool, 
  population,
  timeOfDay,
  weather,
  season,
  activeOverlay,
  isBlackout,
  isCinemaActive,
  activeDisasters,
  photoFilter,
  averageHappiness,
  congestionLevel
}) => {
  const [hoveredTile, setHoveredTile] = useState<{ x: number, y: number } | null>(null);

  const handleHover = useCallback((x: number, y: number) => {
    setHoveredTile({ x, y });
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredTile(null);
  }, []);

  // Sky lighting environments based on day cycle
  const isNight = timeOfDay < 6.0 || timeOfDay > 18.0;

  const sunAngle = useMemo(() => {
    // 24 hour radial mapping
    const theta = (timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.cos(theta) * 22,
      y: Math.sin(theta) * 22, // arc rises & falls
      z: Math.sin(theta * 0.5) * 11
    };
  }, [timeOfDay]);

  // Complementary moonlight arc rising when the sun sets
  const moonAngle = useMemo(() => {
    const theta = (((timeOfDay + 12) % 24) / 24) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.cos(theta) * 22,
      y: Math.sin(theta) * 22,
      z: Math.sin(theta * 0.5) * 11
    };
  }, [timeOfDay]);

  // Lighting presets with balanced ambient/diffuse ratios
  const sunColor = isNight ? '#1e1b4b' : (weather === 'thunderstorm' ? '#94a3b8' : '#fffbeb');
  const sunIntensity = isNight ? 0.05 : (weather === 'thunderstorm' ? 0.45 : (weather === 'fog' ? 0.95 : 2.3));
  const skyColor = WEATHERS[weather].skyColor;

  const showPreview = hoveredTile && grid[hoveredTile.y][hoveredTile.x].buildingType === BuildingType.None && hoveredTool !== BuildingType.None;
  const previewColor = showPreview ? BUILDINGS[hoveredTool].color : 'white';
  const isBulldoze = hoveredTool === BuildingType.None;
  const previewPos = hoveredTile ? gridToWorld(hoveredTile.x, hoveredTile.y) : [0, 0, 0];

  const windSpeed = WEATHERS[weather].windSpeed;

  const activeFiresMap = useMemo(() => {
    const list: Record<string, boolean> = {};
    activeDisasters.forEach(d => {
      list[`${d.x},${d.y}`] = true;
    });
    return list;
  }, [activeDisasters]);

  return (
    <div className={`absolute inset-0 touch-none transition-all duration-1000 ${
      photoFilter === 'vintage' ? 'sepia contrast-125' : 
      photoFilter === 'blueprint' ? 'invert hue-rotate-180 brightness-75 contrast-200 saturate-150' : 
      photoFilter === 'thermal' ? 'hue-rotate-60 saturate-200 contrast-150' : ''
    }`}>
      <Canvas shadows dpr={[1, 1.3]} gl={{ antialias: true }}>
        <OrthographicCamera makeDefault zoom={42} position={[20, 20, 20]} near={-100} far={200} />
        
        <MapControls 
          enableRotate={true}
          enableZoom={true}
          minZoom={18}
          maxZoom={120}
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={0.05}
          target={[0, -0.5, 0]}
        />

        <color attach="background" args={[isNight ? '#030712' : skyColor]} />
        <fogExp2 attach="fog" color={isNight ? '#030712' : skyColor} density={weather === 'fog' ? 0.045 : 0.005} />

        {/* Ambient environment setup with optimal balance to prevent pitch-dark look */}
        <ambientLight 
          intensity={isNight ? 0.32 : WEATHERS[weather].ambientIntensity * 1.15} 
          color={isNight ? '#1e1b4b' : '#f8fafc'} 
        />
        
        {/* Dynamic moving Sun / Moon lighting arc with balanced directional sources and customized shadow bias */}
        {sunAngle.y > 0 ? (
          <directionalLight
            castShadow
            position={[sunAngle.x, sunAngle.y, sunAngle.z]}
            intensity={sunIntensity}
            color={sunColor}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-20} 
            shadow-camera-right={20}
            shadow-camera-top={20} 
            shadow-camera-bottom={-20}
            shadow-camera-near={0.5}
            shadow-camera-far={55}
            shadow-bias={-0.0003} // eliminates shadow acne and gap leaks
          />
        ) : (
          <directionalLight
            castShadow
            position={[moonAngle.x, moonAngle.y, moonAngle.z]}
            intensity={0.4}
            color="#bae6fd" // beautiful luminous cooling moonlight glow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-20} 
            shadow-camera-right={20}
            shadow-camera-top={20} 
            shadow-camera-bottom={-20}
            shadow-camera-near={0.5}
            shadow-camera-far={55}
            shadow-bias={-0.0003}
          />
        )}

        {/* Night sky lighting points representation */}
        {isNight && !isBlackout && (
          <group>
            {grid.map((row, y) => row.map((tile, x) => {
              if (tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && getHash(x, y) > 0.4) {
                const [wx, _, wz] = gridToWorld(x, y);
                return (
                  <pointLight 
                    key={`light-${x}-${y}`} 
                    color="#fef08a" 
                    intensity={0.4} 
                    distance={3.5} 
                    position={[wx, 0.4, wz]} 
                  />
                );
              }
              return null;
            }))}
          </group>
        )}

        {/* Render interactive storytelling elements */}
        {grid.map((row, y) =>
          row.map((tile, x) => {
            const [wx, _, wz] = gridToWorld(x, y);
            const key = `${x}-${y}`;
            const activeFire = activeFiresMap[key];

            return (
              <React.Fragment key={key}>
                <GroundTile 
                  tile={tile} 
                  grid={grid}
                  activeOverlay={activeOverlay}
                  averageHappiness={averageHappiness}
                  pollutionLevel={congestionLevel}
                  season={season}
                  onHover={handleHover}
                  onLeave={handleLeave}
                  onClick={onTileClick}
                />
                
                {/* Modular Building Visual elements */}
                <group position={[wx, 0, wz]} raycast={() => null}>
                  {tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && (
                    <ProceduralBuilding 
                      type={tile.buildingType} 
                      baseColor={BUILDINGS[tile.buildingType].color} 
                      x={x} y={y} 
                      isNight={isNight}
                      isBlackout={isBlackout}
                      activeOverlay={activeOverlay}
                      season={season}
                      averageHappiness={averageHappiness}
                      pollutionLevel={congestionLevel}
                    />
                  )}
                  {activeFire && (
                    <FireDisasterVFX position={[0, 0, 0]} />
                  )}
                </group>
              </React.Fragment>
            );
          })
        )}

        {/* Dynamic systems, vehicles and citizens population */}
        <group raycast={() => null}>
          <TrafficSystem grid={grid} isNight={isNight} isBlackout={isBlackout} activeOverlay={activeOverlay} />
          <PopulationSystem population={population} grid={grid} weather={weather} season={season} />
          <WeatherParticles weather={weather} windSpeed={windSpeed} />
          
          {/* Construction Blueprint preview */}
          {showPreview && hoveredTile && (
            <group position={[previewPos[0], 0, previewPos[2]]}>
              <Float speed={4} floatIntensity={0.12} floatingRange={[0, 0.1]}>
                <ProceduralBuilding 
                  type={hoveredTool} 
                  baseColor={previewColor} 
                  x={hoveredTile.x} 
                  y={hoveredTile.y} 
                  isNight={isNight}
                  isBlackout={isBlackout}
                  activeOverlay={activeOverlay}
                  season={season}
                  averageHappiness={95}
                  pollutionLevel={10}
                />
              </Float>
            </group>
          )}

          {/* Cursor selection */}
          {hoveredTile && (
            <Cursor 
              x={hoveredTile.x} 
              y={hoveredTile.y} 
              color={isBulldoze ? '#f43f5e' : (showPreview ? '#cbd5e1' : '#ffffff')} 
            />
          )}
        </group>

        {/* Renders photo filter settings */}
        <PhotoFilterOverlay filter={photoFilter} />

        {/* Orbit drone / camera automation views */}
        <CinematicCameraEngine active={isCinemaActive} style={isCinemaActive ? 'flyover' : 'default'} />

        <SoftShadows size={8} samples={6} />
      </Canvas>
    </div>
  );
};

export default IsoMap;
