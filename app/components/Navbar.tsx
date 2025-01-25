import { Button } from "@/components/ui/button"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import Image from "next/image"
import logo from '../images/logo.png'

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors } = useConnect()

  const handleConnect = () => {
    const connector = connectors[0]
    if (connector) connect({ connector })
  }

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
        <div className="flex items-center space-x-4">
          {isConnected ? (
            <>
              <span className="text-sm">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <Button 
                variant="outline" 
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect}>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
} 