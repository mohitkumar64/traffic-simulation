"use client"
import MainComponent from "@/components/MainComponent";
import { Canvas } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Text, Float, Clouds, Cloud } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from 'three';

export default function Home() {
  return (
    <>
      <div className="h-screen w-full relative font-[family-name:var(--font-geist-sans)]  ">

        {/* HUD OVERLAY (Mock Dashboard) */}
        {/* <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="backdrop-blur-md bg-black/40 border border-white/10 text-white p-6 rounded-2xl shadow-2xl max-w-sm pointer-events-auto transition-transform hover:scale-105">
              <h1 className="text-2xl font-bold mb-1 tracking-wider text-blue-400">CITY MANAGER OS</h1>
              <p className="text-sm text-gray-300 opacity-80 mb-6">Simulation Status: ONLINE</p>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Overall Flow</p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    <span className="font-mono text-lg font-medium text-white">Optimal</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Active Vehicles</p>
                  <p className="font-mono text-xl font-medium text-white">42</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">System Time</p>
                  <p className="font-mono text-xl text-gray-200">12:30 PM (Simulated)</p>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-md bg-black/40 border border-white/10 text-white px-4 py-2 rounded-full pointer-events-auto flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              <span className="text-sm font-semibold tracking-wide">LIVE VIEW</span>
            </div>
          </div>

          <div className="flex justify-center mb-4 text-white/50 text-xs tracking-widest uppercase pointer-events-auto">
            Use mouse / trackpad to interact with the environment
          </div>
        </div> */}

        <Canvas
          camera={{
            position: [0, 120, 120],
            fov: 50
          }}
        >
          {/* Post Processing Effects */}
          {/* <EffectComposer>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={0.5} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer> */}

          {/* Fluffy Volumetric Clouds */}
          {/* <Clouds material={THREE.MeshBasicMaterial}>
            <Cloud segments={40} bounds={[100, 20, 100]} volume={100} color="#ffffff" position={[0, 90, -100]} opacity={0.6} />
            <Cloud segments={20} bounds={[50, 10, 50]} volume={50} color="#e0e0e0" position={[-50, 80, -50]} opacity={0.5} />
            <Cloud segments={20} bounds={[50, 10, 50]} volume={50} color="#e0e0e0" position={[50, 80, -50]} opacity={0.5} />
          </Clouds> */}

          {/* Ambient light for base illumination */}
          <ambientLight intensity={0.5} />

          {/* Directional light to simulate the sun and cast shadows */}
          <directionalLight
            position={[100, 200, 50]}
            intensity={0.1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          {/* Sky to provide a realistic background */}
          {/* <Sky
            distance={450000}
            sunPosition={[400, -10, 200]}

            inclination={0}
            azimuth={0.25}
          /> */}


          {/* <Environment preset="city" /> */}


          <fog attach="fog" args={['#87CEEB', 100, 400]} />

          <axesHelper />

          {/* Floating Text at Horizon */}
          <Float speed={2} rotationIntensity={0.2} floatIntensity={1} floatingRange={[-2, 2]}>
            <Text
              position={[0, 80, -250]}
              fontSize={40}
              color="#ffffff"
              fillOpacity={0.9}
              fontWeight="bold"
              outlineWidth={0.8}
              outlineColor="#1a1a1a"
              anchorX="center"
              anchorY="middle"
            >
              Traffic Simulation
            </Text>
          </Float>

          {/* main scene  */}
          <MainComponent />


          <ContactShadows position={[0, -0.5, 0]} opacity={0.6} scale={200} blur={2} far={10} />
        </Canvas>
      </div>
    </>
  );
}
