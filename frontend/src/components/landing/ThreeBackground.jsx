import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';

function FloatingShapes({ isMobile }) {
  return (
    <>
      {/* Main decision sphere */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
        <Sphere args={[isMobile ? 0.6 : 0.9, isMobile ? 32 : 64, isMobile ? 32 : 64]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#38BDF8"
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </Float>

      {/* Secondary mint sphere */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.6}>
        <Sphere args={[isMobile ? 0.3 : 0.4, isMobile ? 16 : 32, isMobile ? 16 : 32]} position={[isMobile ? 1 : 1.2, isMobile ? 0.6 : 0.8, -1]}>
          <MeshDistortMaterial
            color="#5EEAD4"
            attach="material"
            distort={0.3}
            speed={1.5}
            roughness={0.3}
            metalness={0.6}
          />
        </Sphere>
      </Float>

      {/* Tertiary sphere */}
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.5}>
        <Sphere args={[isMobile ? 0.25 : 0.35, isMobile ? 16 : 32, isMobile ? 16 : 32]} position={[-isMobile ? 1 : 1.2, -0.5, -0.8]}>
          <MeshDistortMaterial
            color="#38BDF8"
            attach="material"
            distort={0.25}
            speed={1.8}
            roughness={0.25}
            metalness={0.7}
          />
        </Sphere>
      </Float>

      {/* Small floating particles */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.4}>
        <Sphere args={[isMobile ? 0.12 : 0.18, isMobile ? 8 : 16, isMobile ? 8 : 16]} position={[isMobile ? 0.8 : 1, -1, 0.6]}>
          <MeshDistortMaterial
            color="#5EEAD4"
            attach="material"
            distort={0.2}
            speed={1}
            roughness={0.4}
            metalness={0.5}
          />
        </Sphere>
      </Float>

      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.45}>
        <Sphere args={[isMobile ? 0.1 : 0.15, isMobile ? 8 : 16, isMobile ? 8 : 16]} position={[-isMobile ? 0.8 : 1, isMobile ? 0.6 : 0.8, 0]}>
          <MeshDistortMaterial
            color="#38BDF8"
            attach="material"
            distort={0.15}
            speed={1.2}
            roughness={0.35}
            metalness={0.55}
          />
        </Sphere>
      </Float>

      <Float speed={0.8} rotationIntensity={0.15} floatIntensity={0.35}>
        <Sphere args={[isMobile ? 0.08 : 0.12, isMobile ? 8 : 16, isMobile ? 8 : 16]} position={[isMobile ? 0.5 : 0.6, isMobile ? 1.5 : 1.8, -0.6]}>
          <MeshDistortMaterial
            color="#5EEAD4"
            attach="material"
            distort={0.18}
            speed={0.8}
            roughness={0.3}
            metalness={0.6}
          />
        </Sphere>
      </Float>

      <Float speed={1.3} rotationIntensity={0.3} floatIntensity={0.5}>
        <Sphere args={[isMobile ? 0.1 : 0.15, isMobile ? 8 : 16, isMobile ? 8 : 16]} position={[-isMobile ? 0.5 : 0.6, -isMobile ? 1.5 : 1.8, 0.4]}>
          <MeshDistortMaterial
            color="#38BDF8"
            attach="material"
            distort={0.22}
            speed={1.3}
            roughness={0.28}
            metalness={0.65}
          />
        </Sphere>
      </Float>
    </>
  );
}

function BackgroundParticles({ isMobile }) {
  const particleCount = isMobile ? 15 : 30;
  const particles = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * (isMobile ? 6 : 8),
        (Math.random() - 0.5) * (isMobile ? 6 : 8),
        (Math.random() - 0.5) * (isMobile ? 4 : 6),
      ],
      scale: Math.random() * (isMobile ? 0.08 : 0.1) + (isMobile ? 0.02 : 0.03),
      speed: Math.random() * 0.5 + 0.2,
    })), [isMobile]
  );

  return (
    <>
      {particles.map((particle, i) => (
        <Float
          key={i}
          speed={particle.speed}
          rotationIntensity={0.1}
          floatIntensity={0.3}
        >
          <Sphere
            args={[particle.scale, isMobile ? 6 : 8, isMobile ? 6 : 8]}
            position={particle.position}
          >
            <MeshDistortMaterial
              color={i % 2 === 0 ? '#38BDF8' : '#5EEAD4'}
              attach="material"
              distort={0.1}
              speed={particle.speed}
              roughness={0.5}
              metalness={0.4}
              transparent
              opacity={0.6}
            />
          </Sphere>
        </Float>
      ))}
    </>
  );
}

export default function ThreeBackground() {
  const isMobile = window.innerWidth < 768;

  return (
    <div className="three-background">
      <Canvas
        camera={{ position: [0, 0, isMobile ? 15 : 12], fov: isMobile ? 50 : 40 }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{ antialias: false, alpha: true }}
        orthographic={false}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[3, 3, 3]} intensity={1} color="#38BDF8" />
          <pointLight position={[-3, -3, -3]} intensity={0.8} color="#5EEAD4" />
          <FloatingShapes isMobile={isMobile} />
          <BackgroundParticles isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
