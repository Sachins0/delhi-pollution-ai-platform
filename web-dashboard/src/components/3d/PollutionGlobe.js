import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Sphere, 
  OrbitControls, 
  Stars, 
  Text, 
  Html,
  useTexture,
  Sparkles,
  Trail
} from '@react-three/drei';
import { Vector3, Color, MathUtils } from 'three';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// Pollution particle system
function PollutionParticles({ pollutionData = [] }) {
  const meshRef = useRef();
  const particlesRef = useRef();
  
  const particleCount = 1000;
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions around sphere
      const radius = 5.2 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Color based on pollution level (red = high, green = low)
      const pollutionLevel = Math.random();
      colors[i3] = pollutionLevel > 0.7 ? 1 : pollutionLevel * 0.5; // Red
      colors[i3 + 1] = pollutionLevel < 0.3 ? 1 : (1 - pollutionLevel) * 0.8; // Green
      colors[i3 + 2] = 0.2; // Blue
      
      sizes[i] = Math.random() * 2 + 1;
    }
    
    return { positions, colors, sizes };
  }, [particleCount]);
  
  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.1;
      
      // Animate particle sizes
      const sizes = particlesRef.current.geometry.attributes.size.array;
      for (let i = 0; i < particleCount; i++) {
        sizes[i] = Math.sin(state.clock.elapsedTime * 2 + i * 0.1) * 0.5 + 1.5;
      }
      particlesRef.current.geometry.attributes.size.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Earth globe with pollution visualization
function Earth({ pollutionData }) {
  const earthRef = useRef();
  const cloudsRef = useRef();
  
  // Load Earth textures
  const earthTexture = useTexture('/textures/earth-day.jpg');
  const earthNormal = useTexture('/textures/earth-normal.jpg');
  const earthSpecular = useTexture('/textures/earth-specular.jpg');
  const cloudsTexture = useTexture('/textures/earth-clouds.png');
  
  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.1;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.12;
    }
  });
  
  return (
    <group>
      {/* Earth */}
      <Sphere ref={earthRef} args={[5, 64, 64]}>
        <meshPhongMaterial
          map={earthTexture}
          normalMap={earthNormal}
          specularMap={earthSpecular}
          shininess={100}
        />
      </Sphere>
      
      {/* Clouds */}
      <Sphere ref={cloudsRef} args={[5.1, 64, 64]}>
        <meshPhongMaterial
          map={cloudsTexture}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
      
      {/* Pollution hotspots */}
      {pollutionData.map((point, index) => (
        <PollutionHotspot 
          key={index} 
          position={point.position} 
          intensity={point.intensity}
          sourceType={point.sourceType}
        />
      ))}
    </group>
  );
}

// Individual pollution hotspot marker
function PollutionHotspot({ position, intensity, sourceType }) {
  const hotspotRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const color = useMemo(() => {
    if (intensity > 200) return '#ff1744'; // Severe
    if (intensity > 100) return '#ff9800'; // Moderate
    return '#4caf50'; // Good
  }, [intensity]);
  
  useFrame((state) => {
    if (hotspotRef.current) {
      hotspotRef.current.scale.setScalar(
        (Math.sin(state.clock.elapsedTime * 3) * 0.2 + 1) * (intensity / 100)
      );
    }
  });
  
  return (
    <group position={position}>
      <Sphere
        ref={hotspotRef}
        args={[0.1, 16, 16]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.8}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </Sphere>
      
      {hovered && (
        <Html>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}>
            <div>AQI: {intensity}</div>
            <div>Source: {sourceType}</div>
          </div>
        </Html>
      )}
      
      <Sparkles count={10} scale={2} size={2} speed={0.4} color={color} />
    </group>
  );
}

// Main 3D pollution globe component
export default function PollutionGlobe({ pollutionData = [] }) {
  // Convert real coordinates to 3D positions
  const processedData = useMemo(() => {
    return pollutionData.map(point => {
      const { latitude, longitude, intensity, sourceType } = point;
      
      // Convert lat/lng to 3D coordinates on sphere
      const phi = (latitude * Math.PI) / 180;
      const theta = ((longitude - 180) * Math.PI) / 180;
      
      const x = -5.2 * Math.cos(phi) * Math.cos(theta);
      const y = 5.2 * Math.sin(phi);
      const z = 5.2 * Math.cos(phi) * Math.sin(theta);
      
      return {
        position: [x, y, z],
        intensity,
        sourceType
      };
    });
  }, [pollutionData]);
  
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#blue" />
        
        <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} />
        
        <Earth pollutionData={processedData} />
        <PollutionParticles pollutionData={processedData} />
        
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          zoomSpeed={0.6}
          rotateSpeed={0.5}
          minDistance={8}
          maxDistance={30}
        />
      </Canvas>
    </div>
  );
}
