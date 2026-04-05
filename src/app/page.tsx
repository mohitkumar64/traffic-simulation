"use client"
import MainComponent from "@/components/MainComponent";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Text, Float, Clouds, Cloud } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from 'three';
import { useEffect, useState, useRef } from 'react';
import { globalTrafficStore, IntersectionState } from '@/components/L';
import { PiMouseRightClickFill, PiMouseScrollFill } from "react-icons/pi";
import { ImCtrl } from "react-icons/im";
import Camera from "@/components/Camera";
import Mousetrap from 'mousetrap';

function TrafficHUD() {
  const [data, setData] = useState(globalTrafficStore.state);

  useEffect(() => {
    const unsubscribe = globalTrafficStore.subscribe(() => {
      setData(globalTrafficStore.state);
    });
    return () => { unsubscribe(); };
  }, []);

  const Panel = ({ id, info }: { id: string, info: IntersectionState }) => {
    const isRed = info.currentGreen === "Switching Phase";

    return (
      <div className="bg-black/60 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[300px] transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold tracking-widest text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">{id}</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] ${isRed ? 'bg-amber-400 text-amber-400 animate-pulse' : 'bg-emerald-400 text-emerald-400'}`}></div>
          </div>
        </div>

        <div className="space-y-4">
          {/* <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10 shadow-inner">
            <span className="text-xs font-bold tracking-widest text-gray-400">PHASE LOGIC</span>
            <span className={`text-sm font-black uppercase tracking-wider drop-shadow-md ${isRed ? 'text-amber-400' : 'text-emerald-400'}`}>
              {info.currentGreen}
            </span>
          </div> */}

          <div className="grid grid-cols-2 gap-4">
            <div className="  flex flex-col gap-1 items-center justify-center bg-black/60 p-1 rounded-md border border-white/10">
              <div className="flex gap-1">
                <div className={`w-4 h-4 rounded-full ${info.NS_state === 'red' ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-red-900/40'}`} />
                <div className={`w-4 h-4 rounded-full ${info.NS_state === 'yellow' ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-yellow-900/40'}`} />
                <div className={`w-4 h-4 rounded-full ${info.NS_state === 'green' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-green-900/40'}`} />
              </div>

              <div className="flex justify-center item-center">
                <span className="text-xs font-bold tracking-widest text-gray-400">
                  {info.NS_state}
                </span>
              </div>


            </div>

            <div className="bg-black/40 py-3 px-5 rounded-lg border border-white/5 border-l-2 border-l-blue-400 shadow-sm relative">
              <span className="block text-[10px] tracking-widest text-gray-500 font-bold mb-1">NORTH/SOUTH</span>
              <span className="text-2xl font-mono text-blue-100 font-medium">{info.NS_queued} <span className="text-xs text-gray-600 font-sans tracking-wide">
                {
                  info.NS_state === 'red' ? "STOPPED" : (info.NS_state === 'yellow' ? "WAITING" : "MOVING")
                }


              </span></span>


            </div>
            <div className=" flex flex-col gap-1 justify-center items-center bg-black/60 p-1 rounded-md border border-white/10">
              <div className="flex gap-1">
                <div className={`w-4 h-4 rounded-full ${info.EW_state === 'red' ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-red-900/40'}`} />
                <div className={`w-4 h-4 rounded-full ${info.EW_state === 'yellow' ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-yellow-900/40'}`} />
                <div className={`w-4 h-4 rounded-full ${info.EW_state === 'green' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-green-900/40'}`} />
              </div>
              <div className="flex justify-center item-center">
                <span className="text-xs font-bold tracking-widest text-gray-400">
                  {info.EW_state}
                </span>
              </div>

            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-white/5 border-l-2 border-l-purple-400 shadow-sm relative">
              <span className="block text-[10px] tracking-widest text-gray-500 font-bold mb-1">EAST/WEST</span>
              <span className="text-2xl font-mono text-purple-100 font-medium">{info.EW_queued} <span className="text-xs text-gray-600 font-sans tracking-wide">WAITING</span></span>


            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-400 font-bold tracking-wider text-[10px]">REMAINING PHASE TIME</span>
              <span className="text-white font-mono font-medium">{Math.ceil(info.timeLeftMS / 1000)}s</span>
            </div>
            <div className="w-full bg-gray-900/80 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 flex rounded-full transition-all duration-1000 ease-linear shadow-[0_0_8px_currentColor] ${isRed ? 'bg-amber-400 text-amber-400' : 'bg-emerald-400 text-emerald-400'}`}
                style={{ width: `${Math.min(100, Math.max(5, (info.timeLeftMS / 15000) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col p-6">
      <div className="flex justify-between items-start w-full">
        <div className="flex space-x-6 pointer-events-auto">
          <Panel id="I1 NODE" info={data.I1} />
          <Panel id="I2 NODE" info={data.I2} />
        </div>

        <div className="bg-black/60 backdrop-blur-xl border border-white/20 text-white px-5 py-3 rounded-2xl flex items-center space-x-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto w-auto">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_red]"></span>
          </span>
          <span className="text-xs font-extrabold tracking-widest text-gray-200 uppercase">CityOS Traffic Core</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [showUI, setShowUI] = useState(false);
  const [id, setId] = useState(0);

  useEffect(() => {
    const handler = () => {
      setId((prev) => ((prev + 1) % 3));
    };

    Mousetrap.bind("ctrl+c", handler);

    return () => {
      Mousetrap.unbind("ctrl+c", handler);
    };
  }, []);


  return (
    <>
      <div className="h-screen w-full relative font-[family-name:var(--font-geist-sans)]  ">


        {/* Toggle Button */}
        <div className="absolute bottom-10 right-10 z-20">
          <button
            className="backdrop-blur-xl bg-black/60 border border-blue-800 text-white font-bold  text-xs px-6 py-3 rounded-full hover:bg-blue-900/40 hover:scale-105 transition-all  pointer-events-auto"
            onClick={() => setShowUI(!showUI)}
          >
            {showUI ? 'HIDE OVERLAY' : 'SHOW OVERLAY'}
          </button>
        </div>

        {showUI && <TrafficHUD />}


        {showUI && <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-4 pointer-events-none">
          <div className="flex items-center gap-3  backdrop-blur-xl rounded-2xl px-5 py-3 border bg-white/10  border-white/60 shadow-xl">
            <PiMouseRightClickFill className="text-emerald-400 text-xl" />
            <span className="text-[10px] font-extrabold tracking-widest text-gray-300 uppercase">Drag to Rotate</span>
          </div>

          <div className="flex items-center gap-3  backdrop-blur-xl rounded-2xl px-5 py-3 border bg-white/10  border-white/60 shadow-xl">
            <PiMouseScrollFill className="text-emerald-400 text-xl " />
            <span className="text-[10px] font-extrabold tracking-widest text-gray-300 uppercase">Scroll to Zoom</span>
          </div>

          <div className="flex items-center gap-3  backdrop-blur-xl rounded-2xl px-5 py-3 bg-white/10 border border-white/60 shadow-xl">
            <div className="flex items-center text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
              <ImCtrl className="text-lg mr-1" />
              <span className="text-gray-400 font-bold mx-1">+</span>
              <PiMouseRightClickFill className="text-xl" />
            </div>
            <span className="text-[10px] font-extrabold tracking-widest text-gray-300 uppercase">Drag to Pan</span>
          </div>
        </div>}



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

          <Camera id={id} />










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
