import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { Grid, BuildingType } from '../../../types';
import { getRoadSurfaceHeightAt, gridToWorld } from '../utils';
import { boxGeo } from './geometries'; // Assuming I move these next

interface TrafficProps {
  grid: Grid;
  isNight: boolean;
  isBlackout: boolean;
}

export const TrafficSystem = ({ grid, isNight, isBlackout }: TrafficProps) => {
  const roadTiles = useMemo(() => {
    const roads: { x: number, y: number }[] = [];
    grid.forEach(row => row.forEach(tile => {
      if (tile.buildingType === BuildingType.Road || tile.buildingType === BuildingType.Bridge) roads.push({ x: tile.x, y: tile.y });
    }));
    return roads;
  }, [grid]);

  // Adjust cars dynamically relative to road counts
  const carCount = Math.min(roadTiles.length * 1.5, 35);
  const carsRef = useRef<THREE.InstancedMesh>(null);
  const headlightsRef = useRef<THREE.InstancedMesh>(null);
  const carsState = useRef<Float32Array>(new Float32Array(0)); 
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const headlightDummy = useMemo(() => new THREE.Object3D(), []);
  
  // Track serialized state of roads
  const prevRoadsRef = useRef<string>('');

  useEffect(() => {
    if (roadTiles.length < 2) return;

    const currentSerialized = roadTiles.map(t => `${t.x},${t.y}`).join(';');
    if (currentSerialized === prevRoadsRef.current && carsState.current.length === carCount * 7) {
      return;
    }
    prevRoadsRef.current = currentSerialized;

    carsState.current = new Float32Array(carCount * 7);
    const carColors = ['#ef4444', '#3b82f6', '#eab308', '#f8fafc', '#1e293b', '#a855f7'];
    const newColors = new Float32Array(carCount * 3);

    for (let i = 0; i < carCount; i++) {
      const idx = i * 7;
      const startNode = roadTiles[Math.floor(Math.random() * roadTiles.length)];
      carsState.current[idx + 0] = startNode.x;
      carsState.current[idx + 1] = startNode.y;
      carsState.current[idx + 2] = startNode.x;
      carsState.current[idx + 3] = startNode.y;
      carsState.current[idx + 4] = 1.0; 
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

      const h = getRoadSurfaceHeightAt(gx, gy, grid);

      const curTile = grid[Math.floor(gy + 0.5)]?.[Math.floor(gx + 0.5)];
      const onBridge = curTile?.buildingType === BuildingType.Bridge;
      const cushion = onBridge ? 0.055 : 0.0;

      dummy.position.set(wx, h + 0.081 + cushion, wz);
      dummy.rotation.set(0, -angle, 0);
      dummy.scale.set(0.38, 0.11, 0.22); 
      dummy.updateMatrix();

      carsRef.current.setMatrixAt(i, dummy.matrix);

      if (headlightsRef.current) {
        const dirX = dx / len;
        const dirY = dy / len;
        
        const hx = wx + dirX * 0.18;
        const hz = wz + dirY * 0.18;

        if (isNight && !isBlackout) {
          headlightDummy.position.set(hx, h + 0.11 + cushion, hz);
          headlightDummy.rotation.set(0, -angle, 0);
          headlightDummy.scale.set(0.06, 0.06, 0.16);
        } else {
          headlightDummy.scale.set(0, 0, 0);
        }
        headlightDummy.updateMatrix();
        headlightsRef.current.setMatrixAt(i, headlightDummy.matrix);
      }
    }
    carsRef.current.instanceMatrix.needsUpdate = true;
    if (headlightsRef.current) {
      headlightsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (roadTiles.length < 2) return null;

  return (
    <group>
      <instancedMesh ref={carsRef} args={[boxGeo, undefined, carCount]} castShadow renderOrder={15}>
        <meshStandardMaterial 
          roughness={0.2} 
          metalness={0.8} 
          emissive={isNight && !isBlackout ? '#4338ca' : '#000000'}
          emissiveIntensity={isNight && !isBlackout ? 0.45 : 0.0}
        />
      </instancedMesh>

      <instancedMesh ref={headlightsRef} args={[boxGeo, undefined, carCount]} renderOrder={16}>
        <meshBasicMaterial color="#fde047" toneMapped={false} />
      </instancedMesh>
    </group>
  );
};
