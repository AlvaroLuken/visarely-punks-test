'use client'

import Image from "next/image";
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Navbar } from "./components/Navbar"
import { PREVIEW_IMAGES } from './lib/constants'
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
import { FloatingFaces } from './components/FloatingFaces'
import { InfoTabs } from './components/InfoTabs'
import { Footer } from "./components/Footer"
import baseNetworkLogo from './images/brands/Base_Network_Logo.svg'
import usdcLogo from './images/brands/usdc_icon.png'
import { RedeemSection } from './components/RedeemSection'
import { createPublicClient, http } from 'viem'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './lib/constants'
import { sepolia } from 'viem/chains'

const customHttpTransport = http("/api/alchemy");

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: customHttpTransport,
});

export default function Home() {
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [lastMintedId, setLastMintedId] = useState<number>()
  const [viewingMint, setViewingMint] = useState(false)
  const [showReloadAlert, setShowReloadAlert] = useState(false)
  const [totalMinted, setTotalMinted] = useState<number>(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPreviewIndex((prev) => 
        prev === PREVIEW_IMAGES.length - 1 ? 0 : prev + 1
      )
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchTotalMinted = async () => {
      try {
        const total = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'totalMinted',
        })
        setTotalMinted(Number(total))
      } catch (error) {
        console.error('Error fetching total minted:', error)
      }
    }

    fetchTotalMinted()
    const interval = setInterval(fetchTotalMinted, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  const handleMintSuccess = (tokenId: number) => {
    setLastMintedId(tokenId)
    setIsDialogOpen(false)
  }

  return (
    <div className="relative min-h-screen bg-white">
      <div className="absolute inset-0">
        <FloatingFaces opacity={0.07} isDialog={false} />
      </div>
      <div className="relative">
        <Navbar />
        
        {/* Hero Section */}
        <main className="container mx-auto p-4">
          <div className="flex flex-col md:flex-row md:items-center md:gap-16 md:min-h-[calc(100vh-100px)]">
            {/* Left column - Description */}
            <div className="flex-1 text-center md:text-left">
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-8 shadow-sm">
                <h1 className="text-5xl font-bold mb-6 text-gray-900">
                  Visarely Punks
                </h1>
                <p className="text-gray-800 text-lg mb-0 leading-relaxed">
                  A generative art collection where every piece is fully on-chain and deterministically generated from your wallet address and token ID. Each unique composition merges Victor Vasarely&apos;s optical art mastery with CryptoPunks&apos; iconic aesthetic, featuring mathematically-derived wave patterns.
                </p>
              </div>
            </div>

            {/* Right column - Preview and Mint */}
            <div className="flex-1 flex flex-col items-center gap-8 mt-6 md:mt-0">
              <div className="w-[450px] h-[450px] border-2 border-dashed rounded-xl flex items-center justify-center backdrop-blur-sm overflow-hidden hover:scale-105 transition-transform duration-300">
                <Image 
                  src={PREVIEW_IMAGES[currentPreviewIndex]}
                  alt="NFT Preview" 
                  width={430} 
                  height={430}
                  className="rounded-lg object-cover transition-opacity duration-500"
                  priority
                />
              </div>
              
              <div className="flex flex-col items-center gap-4 rounded-2xl p-4 backdrop-blur-sm w-full max-w-[450px]">
                {lastMintedId ? (
                  <>
                    <Button 
                      onClick={() => setShowReloadAlert(true)}
                      size="lg"
                      className="w-full py-6 text-lg font-bold hover:scale-105 transition-transform duration-200"
                    >
                      Mint Another NFT
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setViewingMint(true)
                        setIsDialogOpen(true)
                      }}
                      className="w-full py-4"
                    >
                      See Recently Minted #{lastMintedId}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    size="lg"
                    className="w-full py-6 text-lg font-bold hover:scale-105 transition-transform duration-200"
                  >
                    Mint NFT
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Stats Section - New */}
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white/50 backdrop-blur-md rounded-2xl p-8 shadow-sm">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supply</h3>
                <p className="text-gray-800 text-lg mt-1">
                  {totalMinted} / 2000 Minted
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {2000 - totalMinted} Remaining
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Blockchain</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Image 
                    src={baseNetworkLogo} 
                    alt="Base Network" 
                    width={20} 
                    height={20}
                    className="w-5 h-5"
                  />
                  <p className="text-gray-800 text-lg">Base</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mint Price</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Image 
                    src={usdcLogo} 
                    alt="USDC" 
                    width={20} 
                    height={20}
                    className="w-5 h-5"
                  />
                  <p className="text-gray-800 text-lg">500 USDC</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Add RedeemSection before the Learn More section */}
        <RedeemSection />
        
        {/* Learn More Section */}
        <main className="container mx-auto px-4 py-24 min-h-screen flex items-center">
          <div className="w-full max-w-6xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16 text-gray-900">
              Learn More
            </h2>
            <InfoTabs />
          </div>
        </main>

        <Footer />

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
                To mint another NFT, the page needs to reload. Please select &quot;Cancel&quot; to continue viewing your current NFT, otherwise select &quot;Proceed&quot; to reload the page.
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
      </div>
    </div>
  );
}
