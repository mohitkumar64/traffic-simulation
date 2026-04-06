import React from 'react'
import { useGLTF, Clone } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'
import postData from './PostData'

export type TrafficLightHandle = {
  setLight: (color: "red" | "yellow" | "green") => void;
  object: THREE.Object3D;
};

export type IntersectionState = {
  N_queued: number;
  S_queued: number;
  E_queued: number;
  W_queued: number;
  N_state: string;
  S_state: string;
  E_state: string;
  W_state: string;
  currentGreen: string;
  timeLeftMS: number;
};

export const globalTrafficStore = {
  state: {
    I1: { N_queued: 0, S_queued: 0, E_queued: 0, W_queued: 0, N_state: "red", S_state: "red", E_state: "red", W_state: "red", currentGreen: "Switching Phase", timeLeftMS: 0 } as IntersectionState,
    I2: { N_queued: 0, S_queued: 0, E_queued: 0, W_queued: 0, N_state: "red", S_state: "red", E_state: "red", W_state: "red", currentGreen: "Switching Phase", timeLeftMS: 0 } as IntersectionState
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
    const CAR_GAP = 13;

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

      const approach = directionMove === 1 ? 'N' : 'S';

      //  stop at red
      if (distToStopLine >= 0 && distToStopLine < 22 && lights[approach] !== "green") {
        const smoothStop = distToStopLine * 0.6;
        if (smoothStop < maxMove) {
          maxMove = smoothStop;
        }
      }

    } else {

      const stopLineX = center.x - (STOP_LINE_DIST * directionMove);
      const distToStopLine = (stopLineX - pos.x) * directionMove;

      const approach = directionMove === 1 ? 'W' : 'E';

      if (distToStopLine >= 0 && distToStopLine < 22 && lights[approach] !== "green") {
        const smoothStop = distToStopLine * 0.6;
        if (smoothStop < maxMove) {
          maxMove = smoothStop;
        }
      }
    }


    /* ---------- COLLISION ---------- */

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
        const allowedMove = Math.max(0, distToCar - gap);
        if (allowedMove < maxMove) maxMove = allowedMove;
      }
    });

    /* ---------- APPLY MOVEMENT ---------- */

    let completed = false;
    if (maxMove > 0) {
      if (roadDirection === "Z") {
        pos.z += maxMove * directionMove;
        if (pos.z > 160 || pos.z < -100) {
          if (isAmbulance && onComplete) {
            onComplete(id);
            completed = true;
          } else {
            if (pos.z > 160) pos.z = -90;
            if (pos.z < -100) pos.z = 150;
          }
        }
      } else {
        pos.x += maxMove * directionMove;
        if (pos.x > 120 || pos.x < -100) {
          if (isAmbulance && onComplete) {
            onComplete(id);
            completed = true;
          } else {
            if (pos.x > 120) pos.x = -90;
            if (pos.x < -100) pos.x = 110;
          }
        }
      }
    }

    if (!completed) {
      carsPositions.current[id] = { x: pos.x, z: pos.z, roadDir: roadDirection, lane, directionMove, isAmbulance };
    }
  });

  useEffect(() => {
    return () => {
      if (carsPositions.current) {
        delete carsPositions.current[id];
      }
    };
  }, [id, carsPositions]);

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

        // clone car model
        const carClone = carTemplates.clone();

        // random color
        const randomColor = new THREE.Color(
          Math.random(),
          Math.random(),
          Math.random()
        );

        // body mesh names
        const bodyParts = ["Object_126", "Object_93", "Object_54", "Object_71", "Object_115"];

        carClone.traverse((child) => {
          if (child.isMesh) {

            child.material = child.material.clone();

            // apply only to body
            if (bodyParts.includes(child.name)) {

              child.material.color.copy(randomColor);

              if ("metalness" in child.material) {
                child.material.metalness = 1;
              }

              if ("roughness" in child.material) {
                child.material.roughness = 0.6;
              }

            } else {
              child.material.color = randomColor
            }

          }

        });

        arr.push({
          id: crypto.randomUUID(),
          lane: road.lanes[0],
          offset: i * 25,
          speed: 7,
          isOpposite: road.isOpposite,
          roadDirection: road.direction,
          baseX: road.baseX || 0,
          baseZ: road.baseZ || 0,
          carTemplate: carClone, // use colored clone
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
          speed: 7, // Ambulances go considerably faster
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
    I1: { center: { x: 0, z: 0 }, N: ["L1"], S: ["L4"], W: ["L3"], E: ["L2"] },
    I2: { center: { x: 0, z: 103 }, N: ["L8"], S: ["L6"], W: ["L5"], E: ["L7"] }
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
    I1: { N: 0, S: 0, E: 0, W: 0 },
    I2: { N: 0, S: 0, E: 0, W: 0 }
  });

  const waitTime = useRef<any>({
    I1: { N: 0, S: 0, E: 0, W: 0 },
    I2: { N: 0, S: 0, E: 0, W: 0 }
  });

  const lightsState = useRef<any>({
    I1: { N: "red", S: "red", E: "red", W: "red" },
    I2: { N: "red", S: "red", E: "red", W: "red" }
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

      const counts: Record<"I1" | "I2", { N: number, S: number, E: number, W: number, ambN: boolean, ambS: boolean, ambE: boolean, ambW: boolean }> = {
        I1: { N: 0, S: 0, E: 0, W: 0, ambN: false, ambS: false, ambE: false, ambW: false },
        I2: { N: 0, S: 0, E: 0, W: 0, ambN: false, ambS: false, ambE: false, ambW: false }
      };

      const STOP_LINE_DIST = 18;

      // Calculate true number of cars passing/waiting for each intersection
      Object.values(carsPositions.current).forEach((car: any) => {
        const { x, z, roadDir, directionMove, isAmbulance } = car;

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
            const approach = directionMove === 1 ? 'N' : 'S';
            counts[nId][approach as keyof typeof counts[typeof nId]] += 1 as any;
            if (isAmbulance) counts[nId][`amb${approach}` as keyof typeof counts[typeof nId]] = true as any;
          }
        } else {
          const stopLineX = center.x - (STOP_LINE_DIST * directionMove);
          const distToStopLine = (stopLineX - x) * directionMove;
          if (distToStopLine > -20 && distToStopLine < 60 && Math.abs(z - center.z) < 15) {
            const approach = directionMove === 1 ? 'W' : 'E';
            counts[nId][approach as keyof typeof counts[typeof nId]] += 1 as any;
            if (isAmbulance) counts[nId][`amb${approach}` as keyof typeof counts[typeof nId]] = true as any;
          }
        }
      });

      const APPROACHES = ["N", "S", "E", "W"] as const;

      Object.keys(INTERSECTIONS).forEach((idKey: string) => {
        const id = idKey as "I1" | "I2";

        APPROACHES.forEach((app) => {
          if (counts[id][app] > 0 && lightsState.current[id][app] !== "green") {
            waitTime.current[id][app] += 1;
          }
        });

        const isTransitioning = APPROACHES.some(app => lightsState.current[id][app] === "yellow");

        if (greenLock.current[id] > Date.now()) {
          if (isTransitioning) {
            // Must wait for transition to finish
            const stored = globalTrafficStore.state[id];
            stored.N_queued = counts[id].N;
            stored.S_queued = counts[id].S;
            stored.E_queued = counts[id].E;
            stored.W_queued = counts[id].W;
            stored.timeLeftMS = Math.max(0, greenLock.current[id] - Date.now());
            return;
          } else {
            // Check if ambulance demands immediate green
            const hasEmergency = APPROACHES.some(app => counts[id][`amb${app}`] && lightsState.current[id][app] !== "green");

            if (!hasEmergency) {
              // No emergency, respect normal lock
              const stored = globalTrafficStore.state[id];
              stored.N_queued = counts[id].N;
              stored.S_queued = counts[id].S;
              stored.E_queued = counts[id].E;
              stored.W_queued = counts[id].W;
              stored.timeLeftMS = Math.max(0, greenLock.current[id] - Date.now());
              return;
            }
            // If emergency, we bypass the lock and let score logic switch lights!
          }
        }

        //  EMERGENCY OVERRIDE (TOP PRIORITY) ambulance
        let winner: "N" | "S" | "E" | "W" | null = null;
        let maxScore = -1;

        const emergencies = APPROACHES.filter(app => counts[id][`amb${app}`]);

        if (emergencies.length > 0) {
          winner = emergencies[0];
          // update UI store roughly
          const stored = globalTrafficStore.state[id];
          if (winner === "N") stored.currentGreen = "North";
          if (winner === "S") stored.currentGreen = "South";
          if (winner === "E") stored.currentGreen = "East";
          if (winner === "W") stored.currentGreen = "West";
        } else {
          APPROACHES.forEach(app => {
            const score = counts[id][app] * 2 + waitTime.current[id][app];
            if (score > maxScore) {
              maxScore = score;
              winner = app;
            }
          });

          if (maxScore === 0) {
            const currentG = APPROACHES.find(app => lightsState.current[id][app] === "green");
            winner = currentG || "N";
          } else {
            const currentG = APPROACHES.find(app => lightsState.current[id][app] === "green");
            if (currentG) {
              const currScore = counts[id][currentG] * 2 + waitTime.current[id][currentG];
              if (currScore === maxScore) {
                winner = currentG;
              }
            }
          }
        }

        const currentGreen = APPROACHES.find(app => lightsState.current[id][app] === "green") || null;

        if (winner && winner !== currentGreen) {
          if (currentGreen) {
            setIntersectionLights(id, currentGreen, "yellow");
            setTimeout(() => {
              setIntersectionLights(id, currentGreen, "red");
              setIntersectionLights(id, winner!, "green");
            }, 3000); // light yellow 
          } else {
            setIntersectionLights(id, winner, "green");
          }

          const winnerQueue = counts[id][winner];
          greenLock.current[id] = Date.now() + 3000 + 2000 + winnerQueue * 2800; // Let precisely this many cars pass!
        } else if (winner) {
          // Relock with exact time needed to clear the remaining queue natively
          if (emergencies.some(app => app === winner)) {
            greenLock.current[id] = Date.now() + 5000;
          } else {
            const winnerQueue = counts[id][winner];
            if (winnerQueue > 0) greenLock.current[id] = Date.now() + 2000 + winnerQueue * 2800;
          }
        }

        // --- Store Update --- //
        const stored = globalTrafficStore.state[id];
        stored.N_queued = counts[id].N;
        stored.S_queued = counts[id].S;
        stored.E_queued = counts[id].E;
        stored.W_queued = counts[id].W;
        stored.N_state = lightsState.current[id].N;
        stored.S_state = lightsState.current[id].S;
        stored.E_state = lightsState.current[id].E;
        stored.W_state = lightsState.current[id].W;

        const newGreen = APPROACHES.find(app => lightsState.current[id][app] === "green");

        if (newGreen === "N") stored.currentGreen = "North";
        else if (newGreen === "S") stored.currentGreen = "South";
        else if (newGreen === "E") stored.currentGreen = "East";
        else if (newGreen === "W") stored.currentGreen = "West";
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