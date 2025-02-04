'use client'

import Image from "next/image"
import logo from '../images/logo.png'
import { ConnectKitButton } from "connectkit"

export function Navbar() {
  return (
    <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold">
            Visarely Punks
          </div>
          <ConnectKitButton />
        </div>
      </div>
    </nav>
  )
} 