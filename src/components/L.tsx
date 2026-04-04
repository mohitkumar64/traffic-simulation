import React from 'react'
import { useGLTF, Clone } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef, useMemo , useEffect , forwardRef , useImperativeHandle } from 'react'

export type TrafficLightHandle = {
  setLight: (color: "red" | "yellow" | "green") => void;
};

/* ---------------- CAR ---------------- */

function CarOnModel({
  carTemplate,
  speed,
  offset,
  lane,
  baseZ,
  roadDirection,
  isOpposite,
  baseX,
  trafficData,
  direction,
  centerRef
}: any) {

  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const directionMove = isOpposite ? 1 : -1;

    // ✅ movement restored
    if (roadDirection === "Z") {
      meshRef.current.position.z += speed * delta * directionMove;

      if (meshRef.current.position.z > 130) meshRef.current.position.z = -50;
      if (meshRef.current.position.z < -50) meshRef.current.position.z = 130;

    } else {
      meshRef.current.position.x += speed * delta * directionMove;

      if (meshRef.current.position.x > 65) meshRef.current.position.x = -50;
      if (meshRef.current.position.x < -50) meshRef.current.position.x = 60;
    }

    // ✅ detection

// 🔥 FINAL CLEAN DETECTION (lane-based using light alignment)

const RANGE = 8;
const pos = meshRef.current.position;

// we already know direction
let isNear = false;

if (direction === "NS") {
  // cars moving vertically → check Z near intersection zone
  isNear = pos.z > -10 && pos.z < 10;
} else {
  // cars moving horizontally → check X near intersection
  isNear = pos.x > -10 && pos.x < 10;
}

if (isNear) {
  if (direction === "NS") {
    trafficData.current.NS += 1;
  } else {
    trafficData.current.EW += 1;
  }
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
            : (isOpposite ? 4.7: -4.7),
          0
        ]}
      >
        <Clone object={carTemplate} scale={0.015} />
      </group>
    </group>
  );
}

/* ---------------- TRAFFIC ---------------- */

function TrafficOnModel({ trafficData, center }: any) {
  const { scene } = useGLTF('/models/car.glb') as any;

  const carTemplates = useMemo(() => scene, [scene]);

  const ROADS = [
    { direction: "Z", lanes: [-4.5], isOpposite: false },
    { direction: "Z", lanes: [4.6], isOpposite: true },

    { direction: "X", lanes: [-5.9], baseX: -53.3, isOpposite: true },
    { direction: "X", lanes: [-5.9], baseX: 60, baseZ: 0, isOpposite: false },

    { direction: "X", lanes: [4.2], baseX: -53.3, baseZ:103, isOpposite: true },
    { direction: "X", lanes: [4.2], baseX: 60, baseZ:103, isOpposite: false },
  ];

  const carsData = useMemo(() => {
    const arr: any[] = [];
    const MIN_GAP = 20;
    const MAX_CARS = 3;

    ROADS.forEach((road) => {
      const count = Math.floor(Math.random() * MAX_CARS) + 1;
      let lastOffset = Math.random() * 50;

      for (let i = 0; i < count; i++) {
        const offset = lastOffset + MIN_GAP + Math.random() * 10;

        arr.push({
          id: crypto.randomUUID(),
          lane: road.lanes[0],
          offset,
          speed: 5,
          isOpposite: road.isOpposite,
          roadDirection: road.direction,
          baseX: road.baseX || 0,
          baseZ: road.baseZ || 0,
          carTemplate: carTemplates,
          direction: road.direction === "Z" ? "NS" : "EW" // 🔥 key
        });

        lastOffset = offset;
      }
    });

    return arr;
  }, [carTemplates]);

  return (
    <group>
     {carsData.map((car) => (
  <CarOnModel
    key={car.id}
    {...car}
    trafficData={trafficData}
    centerRef={center}
  />
))}
    </group>
  );
}

/* ---------------- TRAFFIC LIGHT ---------------- */

export const TrafficLight = forwardRef<TrafficLightHandle, any>(
  ({ position = [0, 0, 0], rotation = [0, 0, 0] }, ref) => {

    const { scene } = useGLTF("/models/sss.glb") as any;
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    const redLight1 = useRef(new THREE.PointLight(0xff0000, 10, 30));
    const redLight2 = useRef(new THREE.PointLight(0xff0000, 10, 30));

    const yellowLight1 = useRef(new THREE.PointLight(0xffaa00, 10, 30));
    const yellowLight2 = useRef(new THREE.PointLight(0xffaa00, 10, 30));

    const greenLight1 = useRef(new THREE.PointLight(0x00ff44, 10, 30));
    const greenLight2 = useRef(new THREE.PointLight(0x00ff44, 10, 30));

    useEffect(() => {
      const redPos = clonedScene.getObjectByName("redlightpos");
      const yellowPos = clonedScene.getObjectByName("yellowlightpos");
      const greenPos = clonedScene.getObjectByName("greenlightpos");

      if (!redPos || !yellowPos || !greenPos) return;

      redPos.clear();
      yellowPos.clear();
      greenPos.clear();

      redPos.add(redLight1.current, redLight2.current);
      yellowPos.add(yellowLight1.current, yellowLight2.current);
      greenPos.add(greenLight1.current, greenLight2.current);
    }, [clonedScene]);

   useImperativeHandle(ref, () => ({
  setLight(color: "red" | "yellow" | "green") {
    const all = [redLight1, redLight2, yellowLight1, yellowLight2, greenLight1, greenLight2];
    all.forEach(l => l.current && (l.current.intensity = 0));

    const INT = 20;

    if (color === "red") {
      redLight1.current.intensity = INT;
      redLight2.current.intensity = INT;
    }
    if (color === "yellow") {
      yellowLight1.current.intensity = INT;
      yellowLight2.current.intensity = INT;
    }
    if (color === "green") {
      greenLight1.current.intensity = INT;
      greenLight2.current.intensity = INT;
    }
  },

  // 🔥 NEW — expose object for position
  object: clonedScene
}));

    return <primitive object={clonedScene} position={position} rotation={rotation} />;
  }
);

TrafficLight.displayName = "TrafficLight";

/* ---------------- MAIN ---------------- */

export function MainScene(props: any) {
  const { nodes, materials } = useGLTF('/models/l.glb') as any;
  const intersectionCenters = useRef({
  I1: new THREE.Vector3()
});

  const trafficRefs = useRef<Record<string, any>>({});
  const trafficData = useRef({ NS: 0, EW: 0 });

  const TRAFFIC_LIGHTS = [
    { id: "L1", position: [11, -3.6, -11], rotation: [0, Math.PI/2, 0] },
    { id: "L2", position: [11, -3.6, 11], rotation: [0, 0, 0] },
    { id: "L3", position: [-11, -3.6, -11], rotation: [0, Math.PI, 0] },
    { id: "L4", position: [-11, -3.6, 11], rotation: [0, Math.PI*(250/180), 0] },
  ];

  const INTERSECTIONS = {
    I1: {
      NS: ["L1", "L4"],
      EW: ["L2", "L3"]
    }
  };

  function setIntersectionLights(id: "I1", group: "NS" | "EW", color: any) {
    INTERSECTIONS[id][group].forEach(l => {
      trafficRefs.current[l]?.setLight(color);
    });
  }

  // reset counts
  useEffect(() => {
    const reset = setInterval(() => {
      trafficData.current.NS = 0;
      trafficData.current.EW = 0;
    }, 1000);
    return () => clearInterval(reset);
  }, []);

  // priority logic
  useEffect(() => {
    const interval = setInterval(() => {
      const { NS, EW } = trafficData.current;

      console.log("Traffic:", { NS, EW });

      if (NS > EW) {
        setIntersectionLights("I1", "NS", "green");
        setIntersectionLights("I1", "EW", "red");
      } else {
        setIntersectionLights("I1", "NS", "red");
        setIntersectionLights("I1", "EW", "green");
      }

    }, 3000);

    return () => clearInterval(interval);
  }, []);

useEffect(() => {
  const interval = setInterval(() => {
    const ids = ["L1", "L2", "L3", "L4"];

    let sum = new THREE.Vector3();
    let count = 0;

    ids.forEach((id) => {
      const obj = trafficRefs.current[id]?.object;

      if (obj) {
        sum.add(obj.position);
        count++;
      }
    });

    // wait until ALL lights are ready
    if (count === ids.length) {
      intersectionCenters.current.I1 = sum.divideScalar(count);

      console.log("✅ CENTER READY:", intersectionCenters.current.I1);

      clearInterval(interval); // 🔥 stop checking
    }
  }, 100);

  return () => clearInterval(interval);
}, []);

  return (
    <group {...props}>
      <group position={[-0.002, -0.278, -0.03]} rotation={[-Math.PI / 2, 0, 0]} scale={3.375}>
        <mesh geometry={nodes.Object_1.geometry} material={materials['Material.001']} />
        <mesh geometry={nodes.Object_1_1.geometry} material={materials['Material.002']} />
        <mesh geometry={nodes.Object_1_2.geometry} material={materials['Material.003']} />
        <mesh geometry={nodes.Object_1_3.geometry} material={materials['Material.004']} />
        <mesh geometry={nodes.Object_1_4.geometry} material={materials.acera} />
        <mesh geometry={nodes.Object_1_5.geometry} material={materials.pabimento} />
      </group>

      <TrafficOnModel
  trafficData={trafficData}
  center={intersectionCenters}
/>

      {TRAFFIC_LIGHTS.map(light => (
        <TrafficLight
          key={light.id}
          ref={(el) => el && (trafficRefs.current[light.id] = el)}
          position={light.position}
          rotation={light.rotation}
        />
      ))}
    </group>
  );
}

useGLTF.preload('/models/l.glb')