"use client"

import { OrbitControls } from "@react-three/drei";
import { MainScene } from "./L";

function MainComponent() {
  return (
    <>
    <OrbitControls 
    maxDistance={200}

    />
    <MainScene />     
    </>
   
  );
}

export default MainComponent;
