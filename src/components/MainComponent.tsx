"use client"

import { OrbitControls } from "@react-three/drei";
import { MainScene } from "./L";

function MainComponent() {
  return (
    <>
      <OrbitControls
    target={[0, 0, 0]}        
    enableDamping
    dampingFactor={0.1}

    rotateSpeed={1.5}         
    zoomSpeed={2}          
    panSpeed={1.2}            

    minDistance={1}
    maxDistance={300}

    maxPolarAngle={Math.PI / 2.1} 
  />
    <MainScene />     
    </>
   
  );
}

export default MainComponent;
