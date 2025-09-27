import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Text, OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import * as THREE from 'three';

function AnimatedBar({ position, height, color, label, value }) {
  const meshRef = useRef();
  const targetHeight = height;
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Animate bar growth
      const currentScale = meshRef.current.scale.y;
      const newScale = THREE.MathUtils.lerp(currentScale, targetHeight, delta * 2);
      meshRef.current.scale.y = newScale;
      
      // Subtle floating animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
    }
  });
  
  return (
    <group position={position}>
      <Box
        ref={meshRef}
        args={[0.8, 1, 0.8]}
        scale={[1, 0, 1]}
      >
        <meshLambertMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          transparent
          opacity={0.9}
        />
      </Box>
      
      <Text
        position={[0, targetHeight + 0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {value}
      </Text>
      
      <Text
        position={[0, -0.7, 0]}
        fontSize={0.2}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {label}
      </Text>
    </group>
  );
}

export default function PollutionChart3D({ data = [] }) {
  const processedData = useMemo(() => {
    return data.map((item, index) => {
      const normalizedHeight = (item.value / 300) * 4; // Normalize to 4 units max height
      const color = item.value > 200 ? '#ff1744' : 
                   item.value > 100 ? '#ff9800' : '#4caf50';
      
      return {
        position: [(index - data.length / 2) * 1.5, 0, 0],
        height: normalizedHeight,
        color,
        label: item.label,
        value: item.value
      };
    });
  }, [data]);
  
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas camera={{ position: [0, 3, 8], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, 5, -10]} intensity={0.4} color="#4fc3f7" />
        
        {processedData.map((bar, index) => (
          <AnimatedBar
            key={index}
            position={bar.position}
            height={bar.height}
            color={bar.color}
            label={bar.label}
            value={bar.value}
          />
        ))}
        
        {/* Grid floor */}
        <gridHelper args={[20, 20, '#333333', '#333333']} position={[0, -1, 0]} />
        
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
