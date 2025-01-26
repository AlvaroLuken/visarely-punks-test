'use client'

import Image from "next/image";
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Navbar } from "./components/Navbar"
import preview1 from './images/preview1.svg'
import preview2 from './images/preview2.svg'
import preview3 from './images/preview3.svg'
import { MintDialog } from './components/MintDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const PREVIEW_IMAGES = [
  preview1,
  preview2,
  preview3,
  // Add more SVG paths as needed
]

export default function Home() {
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0)
  const { isConnected } = useAccount()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [lastMintedId, setLastMintedId] = useState<number>()
  const [viewingMint, setViewingMint] = useState(false)
  const [showReloadAlert, setShowReloadAlert] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPreviewIndex((prev) => 
        prev === PREVIEW_IMAGES.length - 1 ? 0 : prev + 1
      )
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  const handleMintSuccess = (tokenId: number) => {
    setLastMintedId(tokenId)
    setIsDialogOpen(false)
  }

  return (
    <div>
      <Navbar />
      <main className="container mx-auto p-4 flex flex-col items-center gap-8">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold mt-8 mb-4">Visarely Punks</h1>
          <p className="text-gray-600 text-lg px-4">
            A generative art collection merging Victor Vasarely&apos;s optical art mastery with CryptoPunks&apos; iconic aesthetic. Each piece features mathematically-derived wave patterns hosting unique punk characters with varying traits. From rare 8-piece grids to dense 24-character compositions, every mint produces distinct arrangements determined by the minter&apos;s address.
          </p>
        </div>
        <div className="w-[300px] h-[300px] border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
          <Image 
            src={PREVIEW_IMAGES[currentPreviewIndex]}
            alt="NFT Preview" 
            width={280} 
            height={280}
            className="rounded-lg object-cover transition-opacity duration-500"
          />
        </div>
        
        <div className="flex flex-col items-center gap-4">
          {lastMintedId ? (
            <>
              <Button 
                onClick={() => setShowReloadAlert(true)}
                size="lg"
              >
                Mint Another NFT
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setViewingMint(true)
                  setIsDialogOpen(true)
                }}
              >
                See Recently Minted #{lastMintedId}
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsDialogOpen(true)}
              size="lg"
            >
              Mint NFT
            </Button>
          )}
        </div>

        <MintDialog 
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setViewingMint(false)
          }}
          onMintSuccess={handleMintSuccess}
          viewMode={viewingMint}
          existingTokenId={viewingMint ? lastMintedId : undefined}
        />

        <AlertDialog open={showReloadAlert} onOpenChange={setShowReloadAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reload Page to Mint Again</AlertDialogTitle>
              <AlertDialogDescription>
                To mint another NFT, the page needs to reload. Please select "Cancel" to continue viewing your current NFT, otherwise select "Proceed" to reload the page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => window.location.reload()}>
                Proceed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
