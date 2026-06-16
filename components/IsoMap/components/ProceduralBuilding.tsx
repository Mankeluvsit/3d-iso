import React, { useMemo } from 'react';
import * as THREE from 'three';
import { BuildingType, Grid } from '../../../types';
import { getHash, getTileHeight } from '../utils';
import { getBridgeOrientationAndValidity } from '../../../src/kernel/Command';
import { SEASONS, OverlayType } from '../../../src/kernel/visual/VisualEngineState';
import { SeasonType } from '../../../src/kernel/visual/VisualEngineState';
import { LightPole } from './LightPole'; // Wait, need to fix LightPole import path?

// I'll need to move shared geometries too to a shared file or redefine them.
// Let's redefine them for now to get a working refactoring.
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
const sphereGeo = new THREE.SphereGeometry(1, 8, 8);

// I need WindowBlock too.
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

// Need ConstructionBuilding
const ConstructionBuilding = ({ height }: { height: number }) => {
  const progressMeshRef = React.useRef<THREE.Mesh>(null);
  const flashLightRef = React.useRef<THREE.PointLight>(null);

  React.useFrame((state: any) => {
    const time = state.clock.getElapsedTime();
    if (progressMeshRef.current) {
      progressMeshRef.current.position.y = -0.3 + Math.sin(time) * 0.05;
    }
    if (flashLightRef.current) {
      flashLightRef.current.intensity = Math.sin(time * 8) > 0 ? 2 : 0;
    }
  });

  return (
    <group>
      <mesh geometry={boxGeo} scale={[0.88, 0.08, 0.88]} position={[0, -0.28, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#d97706" roughness={1} />
      </mesh>
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
      <mesh geometry={boxGeo} scale={[0.78, height * 0.8, 0.78]} position={[0, height / 2 - 0.3, 0]}>
        <meshStandardMaterial color="#eab308" wireframe />
      </mesh>
      <pointLight ref={flashLightRef} color="#eab308" distance={3} position={[0, height - 0.1, 0]} />
      <mesh geometry={sphereGeo} scale={0.08} position={[0, height - 0.2, 0]}>
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
};

// Need SmokeStackProps
const SmokeStackProps = ({ position, pollutionLevel }: { position: [number, number, number], pollutionLevel: number }) => {
  const ref = React.useRef<THREE.Group>(null);
  React.useFrame((state: any) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const cloud = child as THREE.Mesh;
        cloud.position.y += 0.015 + i * 0.003;
        cloud.scale.addScalar(0.006);
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
