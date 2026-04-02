"use client"
import MainComponent from "@/components/MainComponent";
import { Canvas } from "@react-three/fiber";


export default function Home() {
  return (
    <>

      <div className="h-screen w-full font-[family-name:var(--font-geist-sans)]">
        <Canvas >
          <ambientLight intensity={1} />
          <axesHelper />
          <MainComponent />
        </Canvas>
      </div>
    </>
  );
}
