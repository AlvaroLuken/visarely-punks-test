'use client'

import Image from 'next/image'
import xLogo from '../images/brands/logo-black.png'

export function Footer() {
  return (
    <footer className="container mx-auto p-4 flex justify-between items-center border-t mt-8">
      <div className="text-sm text-gray-600">
        © 2024 Visarely Punks. All rights reserved.
      </div>
      <a 
        href="https://x.com/VisarelyPunks" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Image
          src={xLogo}
          alt="X (Twitter)"
          width={16}
          height={16}
          className="w-4 h-4 opacity-75 hover:opacity-100 transition-opacity"
        />
      </a>
    </footer>
  )
} 