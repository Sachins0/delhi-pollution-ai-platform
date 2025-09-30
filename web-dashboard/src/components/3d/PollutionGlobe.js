import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

export default function PollutionGlobe() {
  const mountRef = useRef(null);
  const meshRef = useRef(null);
  const frameIdRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (hasError) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const mountNode = mountRef.current;  

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // Sphere Geometry and Material
    const geometry = new THREE.SphereGeometry(3, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x156289,
      roughness: 0.7,
      metalness: 0.0,
      flatShading: true,
    });

    const sphere = new THREE.Mesh(geometry, material);
    meshRef.current = sphere;
    scene.add(sphere);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    let prevTime = Date.now();
    const rotationSpeed = 0.2;

    // Animation Loop
    const animate = () => {
      try {
        frameIdRef.current = requestAnimationFrame(animate);
        const currentTime = Date.now();
        const delta = (currentTime - prevTime) / 1000;
        prevTime = currentTime;

        if (meshRef.current) {
          meshRef.current.rotation.y += rotationSpeed * delta;
        }

        renderer.render(scene, camera);
      } catch (e) {
        console.error("Three.js rendering error: ", e);
        setHasError(true);
        cancelAnimationFrame(frameIdRef.current);
      }
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mountNode) {
      mountNode.removeChild(renderer.domElement);
    }
    };
  }, [hasError]);

  if (hasError) {
    return (
      <div
        style={{
          color: "red",
          textAlign: "center",
          padding: 20,
          fontWeight: "bold",
        }}
      >
        ⚠️ 3D Visualization unavailable due to rendering error.
        <br />
        Please refresh the page or try a different device.
      </div>
    );
  }

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
