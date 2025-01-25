import { Button } from "@/components/ui/button"
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors } = useConnect()

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="ml-auto flex items-center space-x-4">
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
            <Button 
              onClick={() => {
                const connector = connectors[0]
                if (connector) connect({ connector })
              }}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
} 