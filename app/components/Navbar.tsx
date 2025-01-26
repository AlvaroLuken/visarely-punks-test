import { Button } from "@/components/ui/button"
import Image from "next/image"
import logo from '../images/logo.png'
import { ConnectKitButton } from "connectkit"

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Image 
            src={logo}
            alt="Visarely Punks Logo"
            width={40}
            height={40}
            priority
          />
          <span className="text-xl font-bold">Visarely Punks</span>
        </div>
        <ConnectKitButton />
      </div>
    </nav>
  )
} 