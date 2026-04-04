import React from 'react'
import { useGLTF, Clone } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef, useMemo , useEffect , forwardRef , useImperativeHandle } from 'react'

export type TrafficLightHandle = {
  setLight: (color: "red" | "yellow" | "green") => void;
};

/* ---------------- CAR ---------------- */


function CarOnModel({ carTemplate, speed, offset, lane, baseZ , roadDirection, isOpposite, baseX }: any) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const direction = isOpposite ? 1 : -1;
    

   if (roadDirection === "Z") {
 // meshRef.current.position.z += speed * delta * direction;

  if (meshRef.current.position.z > 130) meshRef.current.position.z = -50;
  if (meshRef.current.position.z < -50) meshRef.current.position.z = 130;
}else{
  
   //  meshRef.current.position.x += speed * delta * direction;
  
  
  if (meshRef.current.position.x > 65) meshRef.current.position.x = -50;
  if (meshRef.current.position.x < -50) meshRef.current.position.x = 60;


} 

  });

  return (
    <group
      ref={meshRef}
      position={
  roadDirection === "Z"
    ? [lane, -3, offset]
    : [baseX + offset, -3, isOpposite ? baseZ-5 : baseZ + 5]
}
    >
      <group
       rotation={[
           0,
        roadDirection === "Z"
          ? (isOpposite ? Math.PI : 0)
          : (isOpposite ? 4.7: -4.7), // same because movement is Z
          0
      ]}
      >
        <Clone object={carTemplate} scale={0.015} />
      </group>
    </group>
  );
}

/* ---------------- TRAFFIC ---------------- */

function TrafficOnModel() {
 const { scene } = useGLTF('/models/car.glb') as any;

const carTemplates = useMemo(() => {
  return scene;
}, [scene]);

  /* 🔥 CORRECT ROAD STRUCTURE */
 const ROADS = [
  // main road (horizontal)
  { direction: "Z", lanes: [-4.5], isOpposite: false },
  { direction: "Z", lanes: [4.6], isOpposite: true },

  { direction: "X", lanes: [-5.9], baseX: -53.3, isOpposite: true },
  { direction: "X", lanes: [-5.9], baseX: 60, baseZ: 0,  isOpposite: false },

  { direction: "X", lanes: [4.2], baseX: -53.3, baseZ :103 , isOpposite: true },
  { direction: "X", lanes: [4.2], baseX: 60 , baseZ :103 , isOpposite: false },
];
console.log("ROADS:", ROADS.length);
 const carsData = useMemo(() => {
  const arr: any[] = [];

  const MIN_GAP = 20;   // 🔥 minimum distance between cars
  const MAX_CARS = 3;   // 🔥 max cars per lane

  ROADS.forEach((road) => {
    const template = carTemplates;

    // 🔥 random number of cars (1 to MAX_CARS)
    const count = Math.floor(Math.random() * MAX_CARS) + 1;

    let lastOffset = Math.random() * 50;

    for (let i = 0; i < count; i++) {
      // 🔥 ensure spacing
      const offset = lastOffset + MIN_GAP + Math.random() * 10;

      arr.push({
        id: crypto.randomUUID(),
        lane: road.lanes[0],
        offset: offset,
        speed: 5 , // slight variation
        isOpposite: road.isOpposite,
        roadDirection: road.direction,
        baseX: road.baseX || 0,
        baseZ: road.baseZ || 0,
        carTemplate: template
      });

      lastOffset = offset;
    }
  });

  console.log("cars:", arr.length);

  return arr;
}, [carTemplates]);

  return (
    <group>
      {carsData.map((car) => (
        <CarOnModel key={car.id} {...car} />
      ))}
    </group>
  );
}

/* ---------------- MAIN ---------------- */


export const TrafficLight = forwardRef<TrafficLightHandle, any>(
  ({ position = [0, 0, 0]  , rotation = [0 ,0 , 0]  }, ref) => {
    const { scene } = useGLTF("/models/sss.glb") as any;

   
    const redLight1 = useRef(new THREE.PointLight(0xff0000, 0, 3));
    const redLight2 = useRef(new THREE.PointLight(0xff0000, 0, 3));

    const yellowLight1 = useRef(new THREE.PointLight(0xffaa00, 0, 3));
    const yellowLight2 = useRef(new THREE.PointLight(0xffaa00, 0, 3));

    const greenLight1 = useRef(new THREE.PointLight(0x00ff44, 0, 3));
    const greenLight2 = useRef(new THREE.PointLight(0x00ff44, 0, 3));

   
   useEffect(() => {
  const redPos = scene.getObjectByName("redlightpos");
  const yellowPos = scene.getObjectByName("yellowlightpos");
  const greenPos = scene.getObjectByName("greenlightpos");

  if (!redPos || !yellowPos || !greenPos) {
    console.error("❌ Light position empties not found. Check Blender names.");
    return;
  }

  // Attach lights to exact positions
  redPos.add(redLight1.current, redLight2.current);
  yellowPos.add(yellowLight1.current, yellowLight2.current);
  greenPos.add(greenLight1.current, greenLight2.current);

}, [scene]);

    /* 🎛️ Expose control */
    useImperativeHandle(ref, () => ({
      setLight(color: "red" | "yellow" | "green") {
        const allLights = [
          redLight1,
          redLight2,
          yellowLight1,
          yellowLight2,
          greenLight1,
          greenLight2
        ];

        // turn all off
        allLights.forEach((l) => {
          if (l.current) l.current.intensity = 0;
        });

        const INTENSITY = 5;

        if (color === "red") {
          redLight1.current.intensity = INTENSITY;
          redLight2.current.intensity = INTENSITY;
        }

        if (color === "yellow") {
          yellowLight1.current.intensity = INTENSITY;
          yellowLight2.current.intensity = INTENSITY;
        }

        if (color === "green") {
          greenLight1.current.intensity = INTENSITY;
          greenLight2.current.intensity = INTENSITY;
        }
      }
    }));

    return  <Clone 
    object={scene} 
    position={position} 
    rotation={rotation} 
  />;
  }
);
TrafficLight.displayName = "TrafficLight";

export function MainScene(props: any) {
  const { nodes, materials } = useGLTF('/models/l.glb') as any;

  // trafficLight1.current.setLight("red")

  const trafficRefs = useRef<Record<string, any>>({});
  const TRAFFIC_LIGHTS = [
  { id: "L1", position: [ 11 , -3.6 , -11 ] , rotation : [0 , Math.PI/2 , 0]},
  { id: "L2", position: [11 , -3.6 , 11] , rotation : [0 , 0 , 0] },
  { id: "L3", position: [ -11 , -3.6 , -11 ] , rotation : [0 , Math.PI , 0]},

  { id: "L4", position: [ -11 , -3.6 ,  91 ] , rotation : [0 , Math.PI , 0]},
  { id: "L5", position: [ 11 , -3.6 ,  91 ] , rotation : [0 , Math.PI/2 , 0]},
  { id: "L6", position: [ 11 , -3.6 ,  113 ] , rotation : [0 , 0, 0]},
 
];



  return (
    <group {...props} dispose={null}>
      <group position={[-0.002, -0.278, -0.03]} rotation={[-Math.PI / 2, 0, 0]} scale={3.375}>
        
        {/* CITY */}
        <mesh geometry={nodes.Object_1.geometry} material={materials['Material.001']} />
        <mesh geometry={nodes.Object_1_1.geometry} material={materials['Material.002']} />
        <mesh geometry={nodes.Object_1_2.geometry} material={materials['Material.003']} />
        <mesh geometry={nodes.Object_1_3.geometry} material={materials['Material.004']} />
        <mesh geometry={nodes.Object_1_4.geometry} material={materials.acera}
          onClick={(e)=>{
            console.log(e.point)
          }}
        />
        <mesh geometry={nodes.Object_1_5.geometry} material={materials.pabimento} />

      </group>

      {/* TRAFFIC */}
      <TrafficOnModel />
      {TRAFFIC_LIGHTS.map((light) => (
      <TrafficLight
        key={light.id}
        ref={(el) => {
          if (el) trafficRefs.current[light.id] = el;
        }}
        position={light.position}
        rotation={light.rotation}
      />
    ))}


    </group>
  )
}

useGLTF.preload('/models/l.glb')