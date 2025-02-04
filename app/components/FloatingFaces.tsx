'use client'

import Image from 'next/image'
import { useMemo } from 'react'
import face5 from '../images/faces/face5.svg'
import face6 from '../images/faces/face6.svg'
import face7 from '../images/faces/face7.svg'
import face8 from '../images/faces/face8.svg'
import face9 from '../images/faces/face9.svg'
import face10 from '../images/faces/face10.svg'
import face11 from '../images/faces/face11.svg'
import face12 from '../images/faces/face12.svg'
import face13 from '../images/faces/face13.svg'
import face14 from '../images/faces/face14.svg'
import face15 from '../images/faces/face15.svg'
import face16 from '../images/faces/face16.svg'
import face17 from '../images/faces/face17.svg'
import face18 from '../images/faces/face18.svg'
import face19 from '../images/faces/face19.svg'
import face20 from '../images/faces/face20.svg'
import face21 from '../images/faces/face21.svg'
import face22 from '../images/faces/face22.svg'
import face23 from '../images/faces/face23.svg'
import face24 from '../images/faces/face24.svg'
import face25 from '../images/faces/face25.svg'
import face26 from '../images/faces/face26.svg'
import face27 from '../images/faces/face27.svg'
import face28 from '../images/faces/face28.svg'

const FACES = [
  ...([face5, face6, face7, face8, face9, face10, face11, face12, face13, face14, face15, face16, face17, face18, face19, face20, face21, face22, face23, face24, face25, face26, face27, face28]),
  ...([face5, face6, face7, face8, face9, face10, face11, face12, face13, face14, face15, face16, face17, face18, face19, face20, face21, face22, face23, face24, face25, face26, face27, face28]),
  ...([face5, face6, face7, face8, face9, face10, face11, face12, face13, face14, face15, face16, face17, face18, face19, face20, face21, face22, face23, face24, face25, face26, face27, face28])
]

export function FloatingFaces({ 
  opacity = 0.015,
  isDialog = false,
  numFaces = 72
}: { 
  opacity?: number, 
  isDialog?: boolean,
  numFaces?: number
}) {
  const faces = useMemo(() => {
    const selectedFaces = isDialog 
      ? Array(numFaces).fill(null).map(() => FACES[Math.floor(Math.random() * FACES.length)])
      : FACES;

    return selectedFaces.map((face, i) => ({
      src: face,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 15 + Math.random() * 20,
      delay: -Math.random() * 20,
      key: i
    }))
  }, [isDialog, numFaces])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {faces.map(face => (
        <div 
          key={face.key}
          className="absolute animate-float"
          style={{
            left: face.left,
            top: face.top,
            animation: `float ${face.duration}s ease-in-out infinite`,
            animationDelay: `${face.delay}s`,
            opacity: isDialog ? opacity * 2 : opacity,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Image
            src={face.src}
            alt="Floating face"
            width={isDialog ? 80 : 240}
            height={isDialog ? 80 : 240}
            className={isDialog ? "w-20 h-20" : "w-60 h-60"}
            priority
          />
        </div>
      ))}
    </div>
  )
} 