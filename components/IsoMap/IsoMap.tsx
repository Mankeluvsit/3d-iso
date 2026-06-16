/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { MapControls, Environment, SoftShadows, Float, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { Grid, BuildingType, TileData } from '../../types';
import { GRID_SIZE, BUILDINGS } from '../../constants';
import { WeatherType, SeasonType, OverlayType, WEATHERS, SEASONS } from '../../src/kernel/visual/VisualEngineState';
import { getRoadSurfaceHeightAt, getHash, gridToWorld, WORLD_OFFSET, isRiverCell, getTileHeight, getBridgeDeckAbsoluteHeight } from './utils';
import { LightPole } from './components/LightPole';
import { TrafficSystem } from './components/TrafficSystem';
import { PopulationSystem } from './components/PopulationSystem';
import { WeatherParticles } from './components/WeatherParticles';
import { boxGeo, cylinderGeo, coneGeo, sphereGeo, flatPlaneGeo } from './components/geometries';
import { getBridgeOrientationAndValidity } from '../../src/kernel/Command';

// Fix for TypeScript not recognizing R3F elements in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// --- Window Material Glow Helper ---
const WindowBlock = React.memo(({ position, scale, isNight, isBlackout }: { position: [number, number, number], scale: [number, number, number], isNight: boolean, isBlackout: boolean }) => {
  const glowing = isNight && !isBlackout;
  return (
    <mesh geometry={boxGeo} position={position} scale={scale}>
      <meshStandardMaterial 
        color={glowing ? '#fef08a' : '#bfdbfe'} 
        emissive={glowing ? '#fef08a' : '#1e3a8a'} 
        emissiveIntensity={glowing ? 2.5 : 0.15} 
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
  grid: Grid;
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
  pollutionLevel,
  grid
}: BuildingStyles) => {
  const hash = getHash(x, y);
  const variant = Math.floor(hash * 100);
  
  let rotation = Math.floor(hash * 4) * (Math.PI / 2);
  if (type === BuildingType.Bridge) {
    let orientation = grid[y]?.[x]?.orientation;
    if (!orientation) {
      const result = getBridgeOrientationAndValidity(x, y, grid);
      orientation = result.orientation;
    }
    rotation = orientation === 'N-S' ? Math.PI / 2 : 0;
  }

  const isUnderConstruction = (type === BuildingType.Residential || type === BuildingType.Commercial || type === BuildingType.Industrial) && hash > 0.85; // Deterministic 15% rate of dynamic active renovation progress

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

          case BuildingType.Bridge:
            {
              const bridgeColor = isNight ? '#475569' : '#94a3b8';
              const railColor = isNight ? '#1e293b' : '#cbd5e1';

              // Find the orientation
              let orientation = grid[y]?.[x]?.orientation;
              if (!orientation) {
                const result = getBridgeOrientationAndValidity(x, y, grid);
                orientation = result.orientation;
              }

              // Negative and positive neighbor coordinates in local space
              const negX = orientation === 'E-W' ? x - 1 : x;
              const negY = orientation === 'E-W' ? y : y - 1;
              const posX = orientation === 'E-W' ? x + 1 : x;
              const posY = orientation === 'E-W' ? y : y + 1;

              // Absolute Y heights of elements
              const Y_deck_abs = getBridgeDeckAbsoluteHeight(x, y, grid);
              const Y_ground_abs = getTileHeight(x, y);

              // Neighbor heights in absolute space
              const getNeighborDeckHeight = (nx: number, ny: number) => {
                if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
                  return getTileHeight(x, y);
                }
                const tile = grid[ny]?.[nx];
                if (tile && tile.buildingType === BuildingType.Bridge) {
                  return getBridgeDeckAbsoluteHeight(nx, ny, grid);
                }
                return getTileHeight(nx, ny);
              };

              const hNeg = getNeighborDeckHeight(negX, negY);
              const hPos = getNeighborDeckHeight(posX, posY);

              const isNegBridge = negX >= 0 && negX < GRID_SIZE && negY >= 0 && negY < GRID_SIZE && grid[negY]?.[negX]?.buildingType === BuildingType.Bridge;
              const isPosBridge = posX >= 0 && posX < GRID_SIZE && posY >= 0 && posY < GRID_SIZE && grid[posY]?.[posX]?.buildingType === BuildingType.Bridge;

              // Relative Heights inside the group (which is positioned at yOffset = Y_ground_abs)
              const Y_neg = hNeg - Y_ground_abs; // Relative height of negative neighbor
              const Y_pos = hPos - Y_ground_abs; // Relative height of positive neighbor
              const Y_deck = Y_deck_abs - Y_ground_abs; // Center bridge deck relative height
              const pillarLength = Y_deck_abs - Y_ground_abs - 0.04;

              // Decks and ramps configuration
              interface BridgePart {
                type: 'flat' | 'ramp';
                position: [number, number, number];
                rotation: [number, number, number];
                length: number;
                height: number;
                side?: 'neg' | 'pos';
              }

              const parts: BridgePart[] = [];

              // --- LEFT HALF DRAWING ---
              if (isNegBridge) {
                // Flat center deck for left half
                parts.push({
                  type: 'flat',
                  position: [-0.25, Y_deck, 0],
                  rotation: [0, 0, 0],
                  length: 0.5,
                  height: Y_deck
                });
              } else {
                // Flat center connector of left half
                parts.push({
                  type: 'flat',
                  position: [-0.075, Y_deck, 0],
                  rotation: [0, 0, 0],
                  length: 0.15,
                  height: Y_deck
                });
                // Ramp slope of left half: from x = -0.5 (Y_neg) to x = -0.15 (Y_deck)
                const dx = 0.35;
                const dy = Y_deck - Y_neg;
                const theta = Math.atan2(dy, dx);
                const len = Math.sqrt(dx * dx + dy * dy);
                parts.push({
                  type: 'ramp',
                  position: [-0.325, (Y_neg + Y_deck) / 2, 0],
                  rotation: [0, 0, theta],
                  length: len,
                  height: (Y_neg + Y_deck) / 2,
                  side: 'neg'
                });
              }

              // --- RIGHT HALF DRAWING ---
              if (isPosBridge) {
                // Flat center deck for right half
                parts.push({
                  type: 'flat',
                  position: [0.25, Y_deck, 0],
                  rotation: [0, 0, 0],
                  length: 0.5,
                  height: Y_deck
                });
              } else {
                // Flat center connector of right half
                parts.push({
                  type: 'flat',
                  position: [0.075, Y_deck, 0],
                  rotation: [0, 0, 0],
                  length: 0.15,
                  height: Y_deck
                });
                // Ramp slope of right half: from x = 0.15 (Y_deck) to x = 0.5 (Y_pos)
                const dx = 0.35;
                const dy = Y_pos - Y_deck;
                const theta = Math.atan2(dy, dx);
                const len = Math.sqrt(dx * dx + dy * dy);
                parts.push({
                  type: 'ramp',
                  position: [0.325, (Y_deck + Y_pos) / 2, 0],
                  rotation: [0, 0, theta],
                  length: len,
                  height: (Y_deck + Y_pos) / 2,
                  side: 'pos'
                });
              }

              return (
                <group>
                  {parts.map((p, idx) => {
                    return (
                      <group key={idx}>
                        {/* Render the deck/ramp under its specific rotation and position */}
                        <group position={p.position} rotation={p.rotation}>
                          {/* Road deck */}
                          <mesh castShadow receiveShadow position={[0, 0, 0]}>
                            <boxGeometry args={[p.length, 0.08, 0.85]} />
                            <meshStandardMaterial color="#334155" roughness={0.8} />
                          </mesh>

                          {/* Guardrails */}
                          <mesh castShadow receiveShadow position={[0, 0.12, 0.42]}>
                            <boxGeometry args={[p.length, 0.18, 0.06]} />
                            <meshStandardMaterial color={railColor} roughness={0.4} />
                          </mesh>
                          <mesh castShadow receiveShadow position={[0, 0.12, -0.42]}>
                            <boxGeometry args={[p.length, 0.18, 0.06]} />
                            <meshStandardMaterial color={railColor} roughness={0.4} />
                          </mesh>
                        </group>

                        {/* Solid ground abutment beneath the ramp */}
                        {p.type === 'ramp' && (
                          <mesh castShadow receiveShadow position={[p.side === 'neg' ? -0.325 : 0.325, p.height / 2, 0]}>
                            <boxGeometry args={[0.35, p.height, 0.81]} />
                            <meshStandardMaterial color="#475569" roughness={0.9} flatShading />
                          </mesh>
                        )}
                      </group>
                    );
                  })}

                  {/* --- Dynamic vertical support columns beneath segments if elevated --- */}
                  {pillarLength > 0.1 && (
                    <group>
                      {/* Left vertical structural column */}
                      <mesh castShadow receiveShadow position={[0, pillarLength / 2, -0.22]}>
                        <boxGeometry args={[0.15, pillarLength, 0.15]} />
                        <meshStandardMaterial color="#64748b" roughness={0.9} flatShading />
                      </mesh>
                      {/* Right vertical structural column */}
                      <mesh castShadow receiveShadow position={[0, pillarLength / 2, 0.22]}>
                        <boxGeometry args={[0.15, pillarLength, 0.15]} />
                        <meshStandardMaterial color="#64748b" roughness={0.9} flatShading />
                      </mesh>
                      {/* Concrete crosscap brace support directly beneath road decks */}
                      <mesh castShadow receiveShadow position={[0, pillarLength - 0.04, 0]}>
                        <boxGeometry args={[0.2, 0.08, 0.65]} />
                        <meshStandardMaterial color="#475569" roughness={0.9} flatShading />
                      </mesh>
                    </group>
                  )}
                </group>
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


// --- Dynamic Walking Citizens component ---
interface PopulationProps {
  population: number;
  grid: Grid;
  weather: WeatherType;
  season: SeasonType;
}

const getRandomClothesColor = () => {
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#e2e8f0', '#06b6d4'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getRandomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// --- Advanced Meandering River component ---
const WaterRiverMesh = ({ 
  x, 
  y, 
  pollutionLevel,
  onHover,
  onLeave,
  onClick
}: { 
  x: number; 
  y: number; 
  pollutionLevel: number;
  onHover: (x: number, y: number) => void;
  onLeave: () => void;
  onClick: (x: number, y: number) => void;
}) => {
  const [wx, _, wz] = gridToWorld(x, y);
  const waveRef = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (waveRef.current) {
      waveRef.current.position.y = -0.25 + Math.sin(time * 1.5 + x * 0.35 + y * 0.35) * 0.012;
    }
    if (rippleRef.current) {
      rippleRef.current.position.y = -0.12 + Math.sin(time * 1.2 + x * 0.25 + y * 0.25) * 0.008;
      const s = 0.92 + Math.cos(time * 1.8 + (x + y) * 0.45) * 0.03;
      rippleRef.current.scale.set(s, 1, s);
    }
  });

  const waterColor = useMemo(() => {
    const clean = new THREE.Color('#0284c7'); // Rich tropical turquoise
    const toxic = new THREE.Color('#15803d'); // Algae toxic green
    const factor = Math.min(pollutionLevel / 100, 1.0);
    return clean.clone().lerp(toxic, factor);
  }, [pollutionLevel]);

  return (
    <group
      onPointerEnter={(e) => { e.stopPropagation(); onHover(x, y); }}
      onPointerOut={(e) => { e.stopPropagation(); onLeave(); }}
      onPointerDown={(e) => {
        e.stopPropagation();
        dragStart.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        const dist = Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y);
        if (dist < 5 && e.button === 0) {
          onClick(x, y);
        }
      }}
    >
      {/* 1. Deep solid riverbed / soil base to give physical volume depth */}
      <mesh position={[wx, -0.6, wz]} receiveShadow>
        <boxGeometry args={[1, 0.4, 1]} />
        <meshStandardMaterial color="#0b1e1f" roughness={0.95} flatShading />
      </mesh>

      {/* 2. Primary highly reflective glassy animated water fluid block */}
      <mesh ref={waveRef} position={[wx, -0.25, wz]} receiveShadow>
        <boxGeometry args={[1, 0.35, 1]} />
        <meshStandardMaterial 
          color={waterColor} 
          roughness={0.05} 
          metalness={0.92} 
          transparent={true} 
          opacity={0.88} 
          emissive={waterColor}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 3. Surface Foam & Ripples */}
      <mesh ref={rippleRef} position={[wx, -0.12, wz]}>
        <boxGeometry args={[0.98, 0.02, 0.98]} />
        <meshStandardMaterial 
          color="#f0f9ff" 
          roughness={0.1} 
          metalness={0.1} 
          transparent={true} 
          opacity={0.25} 
          emissive="#ffffff"
          emissiveIntensity={0.1}
        />
      </mesh>
    </group>
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
  const dragStart = useRef({ x: 0, y: 0 });
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
      const distToPark = 5; 
      if (buildingType === BuildingType.Park) return '#dc2626'; 
      if (buildingType === BuildingType.Commercial) return '#f97316';
      if (buildingType === BuildingType.Residential) return '#eab308';
      return '#3b82f6'; 
    }

    if (activeOverlay === 'pollution') {
      if (buildingType === BuildingType.Industrial) return '#a855f7'; 
      return hash > 0.6 ? '#c084fc' : '#1e1b4b';
    }

    if (activeOverlay === 'traffic') {
      if (buildingType === BuildingType.Road) {
        return hash > 0.72 ? '#ef4444' : hash > 0.45 ? '#f59e0b' : '#10b981';
      }
    }

    if (buildingType === BuildingType.Road) {
      return '#334155'; 
    }

    if (buildingType === BuildingType.None) {
      if (isRiverCell(x, y)) {
        return '#0284c7';
      }
      if (season === 'winter') {
        return '#f1f5f9'; 
      }
      if (season === 'autumn') {
        return '#78350f'; 
      }
      return hash > 0.6 ? '#15803d' : '#166534'; 
    }

    return '#475569'; 
  }, [activeOverlay, buildingType, season, x, y, hash]);

  const h = getTileHeight(x, y);
  const bottomY = -1.2; 
  const thickness = h - bottomY;
  const centerY = bottomY + thickness / 2;

  if ((buildingType === BuildingType.None || buildingType === BuildingType.Bridge) && isRiverCell(x, y) && activeOverlay === 'none') {
    return (
      <WaterRiverMesh 
        x={x} 
        y={y} 
        pollutionLevel={pollutionLevel} 
        onHover={onHover}
        onLeave={onLeave}
        onClick={onClick}
      />
    );
  }

  return (
    <mesh 
      position={[wx, centerY, wz]} 
      receiveShadow castShadow
      onPointerEnter={(e) => { e.stopPropagation(); onHover(x, y); }}
      onPointerOut={(e) => { e.stopPropagation(); onLeave(); }}
      onPointerDown={(e) => {
        e.stopPropagation();
        dragStart.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        const dist = Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y);
        if (dist < 5 && e.button === 0) {
          onClick(x, y);
        }
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
    <group position={[wx, h + 0.04, wz]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer bounding border */}
      <mesh raycast={() => null}>
        <planeGeometry args={[1.0, 1.0]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} depthTest={false} />
      </mesh>
      {/* Inner filled selector accent */}
      <mesh position={[0, 0, 0.005]} raycast={() => null}>
        <planeGeometry args={[0.88, 0.88]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} depthTest={false} transparent opacity={0.7} />
      </mesh>
    </group>
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
  
  // Calculate active tool for preview, converting Road on water to Bridge
  const activePreviewTool = useMemo(() => {
    if (!hoveredTile || hoveredTool !== BuildingType.Road) return hoveredTool;
    return isRiverCell(hoveredTile.x, hoveredTile.y) ? BuildingType.Bridge : BuildingType.Road;
  }, [hoveredTool, hoveredTile]);

  const previewColor = useMemo(() => {
    if (!showPreview) return 'white';
    if (activePreviewTool === BuildingType.Bridge && hoveredTile) {
      const { isValid } = getBridgeOrientationAndValidity(hoveredTile.x, hoveredTile.y, grid);
      return isValid ? '#10b981' : '#f43f5e'; // emerald for valid, red for invalid!
    }
    return BUILDINGS[activePreviewTool].color;
  }, [showPreview, activePreviewTool, hoveredTile, grid]);
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

        <color attach="background" args={[isNight ? '#0b1220' : skyColor]} />
        <fogExp2 attach="fog" color={isNight ? '#0b1220' : skyColor} density={weather === 'fog' ? 0.045 : 0.005} />

        {/* Ambient environment setup with optimal balance to prevent pitch-dark look */}
        <ambientLight 
          intensity={isNight ? 0.78 : WEATHERS[weather].ambientIntensity * 0.9} 
          color={isNight ? '#3b426e' : '#f8fafc'} 
        />

        {/* Hemisphere light representing physical sky dome and ground bounce light */}
        <hemisphereLight
          skyColor={isNight ? '#5c54d6' : '#38bdf8'}
          groundColor={isNight ? '#1e183a' : '#14532d'}
          intensity={isNight ? 0.55 : 0.65}
        />

        {/* Camera-aligned soft fill light to keep camera-facing sides illuminated and legible */}
        <directionalLight
          position={[20, 24, 20]} // mirrors camera vector directions directly
          intensity={isNight ? 0.55 : 0.65}
          color={isNight ? '#7c80f4' : '#f0f9ff'}
          castShadow={false}
        />
        
        {/* Dynamic moving Sun / Moon lighting arc with balanced directional sources and customized shadow bias */}
        {sunAngle.y > 0 ? (
          <directionalLight
            castShadow
            position={[sunAngle.x, sunAngle.y, sunAngle.z]}
            intensity={sunIntensity * 0.8}
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
            intensity={0.72}
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
              if (tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && tile.buildingType !== BuildingType.Bridge && getHash(x, y) > 0.4) {
                const [wx, _, wz] = gridToWorld(x, y);
                const h = getTileHeight(x, y);
                return (
                  <pointLight 
                    key={`light-${x}-${y}`} 
                    color="#fef08a" 
                    intensity={1.25} 
                    distance={3.5} 
                    position={[wx, h + 0.65, wz]} 
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
                      grid={grid}
                    />
                  )}
                  {(tile.buildingType === BuildingType.Road || tile.buildingType === BuildingType.Bridge) && (x + y) % 3 === 0 && (
                    <LightPole x={x} y={y} isNight={isNight} isBlackout={isBlackout} grid={grid} />
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
                  type={activePreviewTool}
                  baseColor={previewColor} 
                  x={hoveredTile.x} 
                  y={hoveredTile.y} 
                  isNight={isNight}
                  isBlackout={isBlackout}
                  activeOverlay={activeOverlay}
                  season={season}
                  averageHappiness={95}
                  pollutionLevel={10}
                  grid={grid}
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
      </Canvas>
    </div>
  );
};

export default IsoMap;
