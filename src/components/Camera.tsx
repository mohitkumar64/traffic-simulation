import React, { useEffect, useRef } from 'react'
import { useThree  } from '@react-three/fiber'
import * as THREE from "three"

const Camera = ({ id }:{id : number}) => {
   const cam1 = useRef<THREE.PerspectiveCamera | null>(null)
const cam2 = useRef<THREE.PerspectiveCamera | null>(null)
const cam3 = useRef<THREE.PerspectiveCamera | null>(null)
const cam4 = useRef<THREE.PerspectiveCamera | null>(null)
const defaultCam = useRef<THREE.PerspectiveCamera | null>(null)

const { camera, set } = useThree()

useEffect(() => {
    if (!defaultCam.current && camera instanceof THREE.PerspectiveCamera) {
        defaultCam.current = camera
    }
}, [camera])

useEffect(() => {
    if (id === 0 && defaultCam.current) {
        set({ camera: defaultCam.current })
    } else if (id === 1 && cam1.current) {
        set({ camera: cam1.current })
    } else if (id === 2 && cam2.current) {
        set({ camera: cam2.current })
    } else if (id === 3 && cam3.current) {
        set({ camera: cam3.current })
    } else if (id === 4 && cam4.current) {
        set({ camera: cam4.current })
    }
}, [id, set])

    return (
        <>
            <perspectiveCamera
                ref={cam1}
                position={[0, 30, 30]}
                fov={75}
                onUpdate={(self) => self.lookAt(0, 0, 0)}
            />
            <perspectiveCamera
                ref={cam2}
                position={[120, 120, 0]}
                fov={75}
                onUpdate={(self) => self.lookAt(0, 0, 0)}
            />
            <perspectiveCamera
                ref={cam3}
                position={[0, 120, 80]}
                fov={40}
                onUpdate={(self) => self.lookAt(0, 0, 0)}
            />
            <perspectiveCamera
                ref={cam4}
                position={[-20, 120, 80]}
                fov={40}
                onUpdate={(self) => self.lookAt(0, 0, 0)}
            />
        </>
    )
}

export default Camera