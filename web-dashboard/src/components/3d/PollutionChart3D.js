import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export default function PollutionChart3D() {
  const mountRef = useRef(null);
  const meshRef = useRef(null);
  const frameIdRef = useRef(null);

  useEffect(() => {
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const mountNode = mountRef.current;  

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // Cube Mesh
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
    const cube = new THREE.Mesh(geometry, material);
    meshRef.current = cube;
    scene.add(cube);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const clock = new THREE.Clock();

    // Animation Loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      try {
        const elapsedTime = clock.getElapsedTime();

        if (material.uniforms && material.uniforms.time) {
          material.uniforms.time.value = elapsedTime;
        }

        if (meshRef.current) {
          meshRef.current.rotation.x = elapsedTime * 0.3;
          meshRef.current.rotation.y = elapsedTime * 0.5;
        }

        renderer.render(scene, camera);
      } catch (error) {
        console.error("Render loop error:", error);
        cancelAnimationFrame(frameIdRef.current);
      }
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mountNode) {
      mountNode.removeChild(renderer.domElement);
    }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
