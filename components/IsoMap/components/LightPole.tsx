
import React from 'react';
import { getRoadSurfaceHeightAt, getHash } from '../utils';
import { Grid } from '../../../types';

export const LightPole = React.memo(({ x, y, isNight, isBlackout, grid }: { x: number, y: number, isNight: boolean, isBlackout: boolean, grid: Grid }) => {
  const h = getRoadSurfaceHeightAt(x, y, grid);
  const hash = getHash(x, y);
  
  const px = hash > 0.52 ? 0.38 : -0.38;
  const pz = hash > 0.52 ? -0.38 : 0.38;
  const lightColor = '#fef08a';
  
  return (
    <group position={[px, h, pz]}>
      <mesh castShadow receiveShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.08, 6]} />
        <meshStandardMaterial color="#475569" roughness={0.9} flatShading />
      </mesh>
      
      <mesh castShadow receiveShadow position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.56, 5]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
      
      <mesh castShadow receiveShadow position={[-px * 0.15, 0.6, -pz * 0.15]} rotation={[0, Math.atan2(pz, px), 0]}>
        <boxGeometry args={[0.22, 0.02, 0.03]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
      
      <mesh castShadow receiveShadow position={[-px * 0.28, 0.59, -pz * 0.28]}>
        <boxGeometry args={[0.08, 0.03, 0.06]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      
      <mesh position={[-px * 0.28, 0.57, -pz * 0.28]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial 
          color={isNight && !isBlackout ? lightColor : '#cbd5e1'} 
          emissive={isNight && !isBlackout ? lightColor : '#000000'}
          emissiveIntensity={isNight && !isBlackout ? 6.0 : 0.0}
          roughness={0.1}
        />
      </mesh>
      
      {isNight && !isBlackout && (
        <pointLight 
          position={[-px * 0.28, 0.52, -pz * 0.28]} 
          color={lightColor} 
          intensity={0.65} 
          distance={4.0} 
          decay={1.2}
          castShadow={false}
        />
      )}
    </group>
  );
});
