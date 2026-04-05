import React from 'react'
import { useGLTF, Clone } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'

export type TrafficLightHandle = {
  setLight: (color: "red" | "yellow" | "green") => void;
  object: THREE.Object3D;
};

export type IntersectionState = {
  NS_queued: number;
  EW_queued: number;
  NS_state: string;
  EW_state: string;
  currentGreen: string;
  timeLeftMS: number;
};

export const globalTrafficStore = {
  state: {
    I1: { NS_queued: 0, EW_queued: 0, NS_state: "red", EW_state: "red", currentGreen: "Switching Phase", timeLeftMS: 0 } as IntersectionState,
    I2: { NS_queued: 0, EW_queued: 0, NS_state: "red", EW_state: "red", currentGreen: "Switching Phase", timeLeftMS: 0 } as IntersectionState
  },
  listeners: new Set<Function>(),
  subscribe: (fn: Function) => {
    globalTrafficStore.listeners.add(fn);
    return () => globalTrafficStore.listeners.delete(fn);
  },
  notify: () => {
    globalTrafficStore.state = {
      I1: { ...globalTrafficStore.state.I1 },
      I2: { ...globalTrafficStore.state.I2 }
    };
    globalTrafficStore.listeners.forEach(fn => fn());
  }
};

/* ---------------- CAR ---------------- */

function CarOnModel({
  id,
  carTemplate,
  isAmbulance,
  speed,
  offset,
  lane,
  baseZ,
  roadDirection,
  isOpposite,
  baseX,
  trafficData,
  lightsState,
  intersections,
  carsPositions,
  direction,
  onComplete
}: any) {

  const meshRef = useRef<THREE.Group>(null);
  const actualSpeed = useRef(speed + Math.random() * 2 - 1).current;

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const directionMove = isOpposite ? 1 : -1;
    const pos = meshRef.current.position;

    let maxMove = actualSpeed * delta;
    const STOP_LINE_DIST = 20;
    const CAR_GAP = 10;

    /* ---------- FIND NEAREST INTERSECTION ---------- */

    let nearest: any = null;
    let minDist = Infinity;

    Object.entries(intersections).forEach(([iName, config]: any) => {
      const dx = pos.x - config.center.x;
      const dz = pos.z - config.center.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < minDist) {
        minDist = dist;
        nearest = { name: iName, config };
      }
    });

    if (!nearest) return;

    const { name: iName, config } = nearest;
    const center = config.center;
    const lights = lightsState.current[iName];

    /* ---------- TRAFFIC + STOP LOGIC ---------- */

    if (roadDirection === "Z") {

      const stopLineZ = center.z - (STOP_LINE_DIST * directionMove);
      const distToStopLine = (stopLineZ - pos.z) * directionMove;


      // ✅ stop at red
      if (distToStopLine >= 0 && distToStopLine < 22 && lights.NS !== "green") {
        const smoothStop = distToStopLine * 0.6;
        if (smoothStop < maxMove) {
          maxMove = smoothStop;
        }
      }

    } else {

      const stopLineX = center.x - (STOP_LINE_DIST * directionMove);
      const distToStopLine = (stopLineX - pos.x) * directionMove;



      if (distToStopLine >= 0 && distToStopLine < 22   && lights.EW !== "green") {
        const smoothStop = distToStopLine * 0.6;
        if (smoothStop < maxMove) {
          maxMove = smoothStop;
        }
      }
    }

    
    let ambulanceBehind = false;

Object.entries(carsPositions.current).forEach(([otherId, other]: any) => {
  if (otherId === id) return;

  const sameLane =
    roadDirection === "Z"
      ? Math.abs(other.x - pos.x) < 2
      : Math.abs(other.z - pos.z) < 2;

  if (!sameLane) return;

  if (other.isAmbulance) {
    const dist =
      roadDirection === "Z"
        ? (pos.z - other.z) * directionMove
        : (pos.x - other.x) * directionMove;

    if (dist > 0 && dist < 35) {
      ambulanceBehind = true;
    }
  }
});

/* ---------- COLLISION ---------- */

// 🚑 ambulance ignores cars (CRITICAL FIX)
if (!isAmbulance) {
  Object.entries(carsPositions.current).forEach(([otherId, otherPos]: any) => {
  if (otherId === id) return;

  const isSameLane =
    roadDirection === "Z"
      ? Math.abs(otherPos.x - pos.x) < 2
      : Math.abs(otherPos.z - pos.z) < 2;

  if (!isSameLane) return;

  const distToCar =
    roadDirection === "Z"
      ? (otherPos.z - pos.z) * directionMove
      : (otherPos.x - pos.x) * directionMove;

  if (distToCar > 0) {
   let gap = CAR_GAP;



    // 🚑 ambulance pushes traffic slightly
    

    const allowedMove = Math.max(0, distToCar - gap);
    if (allowedMove < maxMove) maxMove = allowedMove;
  }
});
}

    /* ---------- APPLY MOVEMENT ---------- */

    if (maxMove > 0) {
      if (roadDirection === "Z") {
        pos.z += maxMove * directionMove;
        if (pos.z > 130 || pos.z < -50) {
          if (isAmbulance && onComplete) {
            onComplete(id);
          } else {
           if (pos.z > 130) pos.z = -49;
          if (pos.z < -50) pos.z = 129;
          }
        }
      } else {
        pos.x += maxMove * directionMove;
        if (pos.x > 65 || pos.x < -53) {
          if (isAmbulance && onComplete) {
            onComplete(id);
          } else {
            if (pos.x > 65) pos.x = -53;
            if (pos.x < -53) pos.x = 65;
          }
        }
      }
    }

    carsPositions.current[id] = { x: pos.x, z: pos.z, roadDir: roadDirection, lane, directionMove, isAmbulance };
  });

  return (
    <group ref={meshRef}
      position={roadDirection === "Z"
        ? [lane, -3, offset]
        : [baseX + offset, -3, isOpposite ? baseZ - 5 : baseZ + 5]}>
      <group rotation={[
        0,
        roadDirection === "Z"
          ? (isOpposite ? Math.PI : 0)
          : (isOpposite ? 4.7 : -4.7),
        0]}>
        <Clone object={carTemplate} scale={isAmbulance ? 0.020 : 0.012} />
      </group>
    </group>
  );
}

/* ---------------- TRAFFIC ---------------- */

function TrafficOnModel({ trafficData, lightsState, intersections, carsPositions }: any) {
  const { scene } = useGLTF('/models/car.glb') as any;
  const { scene: ambulanceScene } = useGLTF('/models/a.glb') as any;

  const carTemplates = useMemo(() => scene, [scene]);
  const ambTemplate = useMemo(() => ambulanceScene, [ambulanceScene]);

  // Baseline standard traffic
  const carsData = useMemo(() => {
    const arr: any[] = [];
    const ROADS = [
      { direction: "Z", lanes: [-4.5], isOpposite: false },
      { direction: "Z", lanes: [4.6], isOpposite: true },
      { direction: "X", lanes: [-5.9], baseX: -53.3, isOpposite: true },
      { direction: "X", lanes: [-5.9], baseX: 60, baseZ: 0, isOpposite: false },
    ];

    ROADS.forEach((road) => {
      for (let i = 0; i < 3; i++) {
        arr.push({
          id: crypto.randomUUID(),
          lane: road.lanes[0],
          offset: i * 25,
          speed: 5,
          isOpposite: road.isOpposite,
          roadDirection: road.direction,
          baseX: road.baseX || 0,
          baseZ: road.baseZ || 0,
          carTemplate: carTemplates,
          isAmbulance: false,
        });
      }
    });

    return arr;
  }, [carTemplates]);

  const [dynamicAmbulances, setDynamicAmbulances] = React.useState<any[]>([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDynamicAmbulances(prev => {
        // Prevent flooding the simulation with too many ambulances
        if (prev.length >= 1) return prev;

        const ROADS = [
          // Z moves from 130 down to -50
          { direction: "Z", lanes: [-4.5], isOpposite: false, offsetStart: 130, baseX: 0, baseZ: 0 },
          // Z moves from -50 up to 130
          { direction: "Z", lanes: [4.6], isOpposite: true, offsetStart: -50, baseX: 0, baseZ: 0 },
          // X moves from -53 up to 65
          { direction: "X", lanes: [-5.9], isOpposite: true, offsetStart: 0, baseX: -53.3, baseZ: 0 },
          // X moves from 65 down to -53
          { direction: "X", lanes: [-5.9], isOpposite: false, offsetStart: 0, baseX: 60, baseZ: 0 },
        ];
        const AMB_ROADS = [
          // NS only (main road)
          { direction: "Z", lanes: [-4.5], isOpposite: false, offsetStart: 130, baseX: 0, baseZ: 0 },
          { direction: "Z", lanes: [4.6], isOpposite: true, offsetStart: -50, baseX: 0, baseZ: 0 },
        ];

       const r = AMB_ROADS[Math.floor(Math.random() * AMB_ROADS.length)];

        return [...prev, {
          id: crypto.randomUUID(),
          lane: r.lanes[0],
          offset: r.offsetStart,
          speed: 5, // Ambulances go considerably faster
          isOpposite: r.isOpposite,
          roadDirection: r.direction,
          baseX: r.baseX || 0,
          baseZ: r.baseZ || 0,
          carTemplate: ambTemplate,
          isAmbulance: true,
        }];
      });
    }, 12000); // Try to spawn roughly every 12 seconds

    return () => clearInterval(interval);
  }, [ambTemplate]);

  return (
    <group>
      {carsData.map((car) => (
        <CarOnModel
          key={car.id}
          {...car}
          trafficData={trafficData}
          lightsState={lightsState}
          intersections={intersections}
          carsPositions={carsPositions}
        />
      ))}
      {dynamicAmbulances.map((amb) => (
        <CarOnModel
          key={amb.id}
          {...amb}
          trafficData={trafficData}
          lightsState={lightsState}
          intersections={intersections}
          carsPositions={carsPositions}
          onComplete={(id: string) => {
            // Remove ambulance when it completes the path
            setDynamicAmbulances(curr => curr.filter(a => a.id !== id));
            delete carsPositions.current[id];
          }}
        />
      ))}
    </group>
  );
}


export const TrafficLight = forwardRef<TrafficLightHandle, any>(
  ({ position = [0, 0, 0], rotation = [0, 0, 0] }, ref) => {

    const { scene } = useGLTF("/models/sss.glb") as any;

    // ✅ clone per instance 
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    // lights
    const red1 = useRef(new THREE.PointLight(0xff0000, 0, 25));
    const red2 = useRef(new THREE.PointLight(0xff0000, 0, 25));

    const yellow1 = useRef(new THREE.PointLight(0xffaa00, 0, 25));
    const yellow2 = useRef(new THREE.PointLight(0xffaa00, 0, 25));

    const green1 = useRef(new THREE.PointLight(0x00ff44, 0, 25));
    const green2 = useRef(new THREE.PointLight(0x00ff44, 0, 25));

    /* ---------- attach lights ---------- */
    useEffect(() => {
      const redPos = clonedScene.getObjectByName("redlightpos");
      const yellowPos = clonedScene.getObjectByName("yellowlightpos");
      const greenPos = clonedScene.getObjectByName("greenlightpos");

      if (!redPos || !yellowPos || !greenPos) {
        console.error(" Missing light anchors in model");
        return;
      }

      // clean old children 
      redPos.clear();
      yellowPos.clear();
      greenPos.clear();

      redPos.add(red1.current, red2.current);
      yellowPos.add(yellow1.current, yellow2.current);
      greenPos.add(green1.current, green2.current);

    }, [clonedScene]);

    /* ---------- control ---------- */
    useImperativeHandle(ref, () => ({
      setLight(color: "red" | "yellow" | "green") {

        const ALL = [red1, red2, yellow1, yellow2, green1, green2];

        // turn all off
        ALL.forEach(l => l.current && (l.current.intensity = 0));

        const INT = 20;

        if (color === "red") {
          red1.current.intensity = INT;
          red2.current.intensity = INT;
        }

        if (color === "yellow") {
          yellow1.current.intensity = INT;
          yellow2.current.intensity = INT;
        }

        if (color === "green") {
          green1.current.intensity = INT;
          green2.current.intensity = INT;
        }
      },


      object: clonedScene
    }));

    return (
      <primitive
        object={clonedScene}
        position={position}
        rotation={rotation}
      />
    );
  }
);

TrafficLight.displayName = "TrafficLight";


/* ---------------- MAIN ---------------- */



export function MainScene(props: any) {

  const { nodes, materials } = useGLTF('/models/l.glb') as any;

  const INTERSECTIONS = {
    I1: { center: { x: 0, z: 0 }, NS: ["L1", "L4"], EW: ["L2", "L3"] },
    I2: { center: { x: 0, z: 103 }, NS: ["L5", "L8"], EW: ["L6", "L7"] }
  };

  const TRAFFIC_LIGHTS = [
    { id: "L1", position: [11, -3.6, -11], rotation: [0, Math.PI / 2, 0] },
    { id: "L2", position: [11, -3.6, 11], rotation: [0, 0, 0] },
    { id: "L3", position: [-11, -3.6, -11], rotation: [0, Math.PI, 0] },
    { id: "L4", position: [-11, -3.6, 11], rotation: [0, Math.PI * (250 / 180), 0] },

    { id: "L5", position: [-11, -3.6, 91], rotation: [0, Math.PI, 0] },
    { id: "L6", position: [11, -3.6, 91], rotation: [0, Math.PI / 2, 0] },
    { id: "L7", position: [11, -3.6, 113], rotation: [0, 0, 0] },
    { id: "L8", position: [-11, -3.6, 113], rotation: [0, Math.PI * (250 / 180), 0] },
  ];

  const trafficRefs = useRef<any>({});
  const carsPositions = useRef<any>({});
  const trafficData = useRef({
    I1: { NS: 0, EW: 0 },
    I2: { NS: 0, EW: 0 }
  });

  const waitTime = useRef<any>({
    I1: { NS: 0, EW: 0 },
    I2: { NS: 0, EW: 0 }
  });

  const lightsState = useRef<any>({
    I1: { NS: "red", EW: "red" },
    I2: { NS: "red", EW: "red" }
  });

  const greenLock = useRef<any>({
    I1: 0,
    I2: 0
  });

  function setIntersectionLights(id: any, group: any, color: any) {
    lightsState.current[id][group] = color;

    if (color === "green") {
      waitTime.current[id][group] = 0;
    }

    (INTERSECTIONS as any)[id][group].forEach((l: any) => {
      trafficRefs.current[l]?.setLight(color);
    });
  }

  /* SMART & TIMER CONTROL */
  useEffect(() => {
    const i = setInterval(() => {

      const counts: Record<"I1" | "I2", { NS: number, EW: number, ambNS: boolean, ambEW: boolean }> = {
        I1: { NS: 0, EW: 0, ambNS: false, ambEW: false },
        I2: { NS: 0, EW: 0, ambNS: false, ambEW: false }
      };

      const STOP_LINE_DIST = 18;

      // Calculate true number of cars passing/waiting for each intersection
      Object.values(carsPositions.current).forEach((car: any) => {
        const { x, z, roadDir, directionMove } = car;

        let nearestId: "I1" | "I2" | null = null;
        let minDist = Infinity;
        Object.entries(INTERSECTIONS).forEach(([iN, conf]: any) => {
          const dx = x - conf.center.x;
          const dz = z - conf.center.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < minDist) { minDist = dist; nearestId = iN as "I1" | "I2"; }
        });

        if (!nearestId) return;
        const nId = nearestId as "I1" | "I2";

        const conf = INTERSECTIONS[nId as keyof typeof INTERSECTIONS] as any;
        const center = conf.center;

        if (roadDir === "Z") {
          const stopLineZ = center.z - (STOP_LINE_DIST * directionMove);
          const distToStopLine = (stopLineZ - z) * directionMove;
          // Count cars that are queuing or passing (expanded detection zone to pick up ambulances sooner)
          if (distToStopLine > -20 && distToStopLine < 60 && Math.abs(x - center.x) < 15) {
            counts[nId].NS += 1;
            if (car.isAmbulance) counts[nId].ambNS = true;
          }
        } else {
          const stopLineX = center.x - (STOP_LINE_DIST * directionMove);
          const distToStopLine = (stopLineX - x) * directionMove;
          if (distToStopLine > -20 && distToStopLine < 60 && Math.abs(z - center.z) < 15) {
            counts[nId].EW += 1;
            if (car.isAmbulance) counts[nId].ambEW = true;
          }
        }
      });

      Object.keys(INTERSECTIONS).forEach((idKey: string) => {
        const id = idKey as "I1" | "I2";
        const NS = counts[id].NS;
        const EW = counts[id].EW;

        if (NS > 0 && lightsState.current[id].NS !== "green") waitTime.current[id].NS += 1;
        if (EW > 0 && lightsState.current[id].EW !== "green") waitTime.current[id].EW += 1;

        const isTransitioning = (lightsState.current[id].NS === "yellow" || lightsState.current[id].EW === "yellow");

        if (greenLock.current[id] > Date.now()) {
          if (isTransitioning) {
            // Must wait for transition to finish
            const stored = globalTrafficStore.state[id];
            stored.NS_queued = NS;
            stored.EW_queued = EW;
            stored.timeLeftMS = Math.max(0, greenLock.current[id] - Date.now());
            return;
          } else {
            // Check if ambulance demands immediate green
            const emergencyNS = counts[id].ambNS && lightsState.current[id].NS !== "green";
            const emergencyEW = counts[id].ambEW && lightsState.current[id].EW !== "green";
            
            if (!emergencyNS && !emergencyEW) {
              // No emergency, respect normal lock
              const stored = globalTrafficStore.state[id];
              stored.NS_queued = NS;
              stored.EW_queued = EW;
              stored.timeLeftMS = Math.max(0, greenLock.current[id] - Date.now());
              return;
            }
            // If emergency, we bypass the lock and let score logic switch lights!
          }
        }

        // 🚨 EMERGENCY OVERRIDE (TOP PRIORITY)
        const emergencyNS = counts[id].ambNS;
        const emergencyEW = counts[id].ambEW;

        if (emergencyNS || emergencyEW) {

          const winner = emergencyNS ? "NS" : "EW";
          const loser = winner === "NS" ? "EW" : "NS";

          // 🚨 instant switch (NO yellow delay)
          setIntersectionLights(id, loser, "red");
          setIntersectionLights(id, winner, "green");

          // short lock so it stays green long enough
          greenLock.current[id] = Date.now() + 5000;

          // update UI store
          const stored = globalTrafficStore.state[id];
          stored.NS_queued = counts[id].NS;
          stored.EW_queued = counts[id].EW;
          stored.currentGreen = winner === "NS" ? "North/South" : "East/West";
          stored.timeLeftMS = 5000;

          return; // 🚨 skip normal logic
        }


        const NS_score = (counts[id].ambNS ? 10000 : 0) + NS * 2 + waitTime.current[id].NS;
        const EW_score = (counts[id].ambEW ? 10000 : 0) + EW * 2 + waitTime.current[id].EW;

        let winner = "NS";
        if (NS_score === 0 && EW_score === 0) {
          winner = lightsState.current[id].NS === "green" ? "NS" : "EW";
        } else if (NS_score === EW_score) {
          winner = lightsState.current[id].NS === "green" ? "NS" : "EW";
        } else if (NS_score > EW_score) {
          winner = "NS";
        } else {
          winner = "EW";
        }

        const currentGreen = lightsState.current[id].NS === "green" ? "NS" : (lightsState.current[id].EW === "green" ? "EW" : null);

        if (winner !== currentGreen) {
          const loser = winner === "NS" ? "EW" : "NS";

          setIntersectionLights(id, loser, "yellow");

          setTimeout(() => {
            setIntersectionLights(id, loser, "red");
            setIntersectionLights(id, winner, "green");
          }, 5000); // 5 second yellow to clear the intersection completely

          greenLock.current[id] = Date.now() + 3000 + 2000 + (winner === "NS" ? NS : EW) * 2800; // Let precisely this many cars pass!
        } else {
          // Relock with exact time needed to clear the remaining queue natively
          if (winner === "NS" && NS > 0) greenLock.current[id] = Date.now() + 2000 + NS * 2800;
          if (winner === "EW" && EW > 0) greenLock.current[id] = Date.now() + 2000 + EW * 2800;
        }

        // --- Store Update --- //
        const stored = globalTrafficStore.state[id];
        stored.NS_queued = NS;
        stored.EW_queued = EW;
        stored.NS_state = lightsState.current[id].NS;
        stored.EW_state = lightsState.current[id].EW;

        if (lightsState.current[id].NS === "green") stored.currentGreen = "North/South";
        else if (lightsState.current[id].EW === "green") stored.currentGreen = "East/West";
        else stored.currentGreen = "Switching Phase";

        stored.timeLeftMS = Math.max(0, greenLock.current[id] - Date.now());

      });

      globalTrafficStore.notify();

    }, 1000);

    return () => clearInterval(i);
  }, []);

  return (
    <group {...props}>

      {/* CITY MODEL */}
      <group position={[-0.002, -0.278, -0.03]} rotation={[-Math.PI / 2, 0, 0]} scale={3.375}>
        <mesh geometry={nodes.Object_1.geometry} material={materials['Material.001']} />
        <mesh geometry={nodes.Object_1_1.geometry} material={materials['Material.002']} />
        <mesh geometry={nodes.Object_1_2.geometry} material={materials['Material.003']} />
        <mesh geometry={nodes.Object_1_3.geometry} material={materials['Material.004']} />
        <mesh geometry={nodes.Object_1_4.geometry} material={materials.acera} />
        <mesh geometry={nodes.Object_1_5.geometry} material={materials.pabimento} />
      </group>

      {/* CARS */}
      <TrafficOnModel
        trafficData={trafficData}
        lightsState={lightsState}
        intersections={INTERSECTIONS}
        carsPositions={carsPositions}
      />

      {/* LIGHTS */}
      {TRAFFIC_LIGHTS.map(light => (
        <TrafficLight
          key={light.id}
          ref={(el) => { if (el) trafficRefs.current[light.id] = el; }}
          position={light.position}
          rotation={light.rotation}
        />
      ))}

    </group>
  );
}