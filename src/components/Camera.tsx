import React, { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'

const Camera = ({ id }) => {
    const cam1 = useRef()
    const cam2 = useRef()
    const cam3 = useRef()
    const cam4 = useRef()
    const defaultCam = useRef()

    const { camera, set } = useThree()

    // store default camera ONLY once
    useEffect(() => {
        if (!defaultCam.current) {
            defaultCam.current = camera
        }
    }, [])

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
    }, [id])

    return (
        <>
            <perspectiveCamera
                ref={cam1}
                position={[0, 30, 30]}
                fov={40}
                onUpdate={(self) => self.lookAt(0, 0, 0)}
            />
            <perspectiveCamera
                ref={cam2}
                position={[120, 120, 0]}
                fov={40}
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