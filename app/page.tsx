'use client'

import Image from "next/image";
import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Navbar } from "./components/Navbar"
import preview1 from './images/preview1.svg'
import preview2 from './images/preview2.svg'
import preview3 from './images/preview3.svg'

const PREVIEW_IMAGES = [
  preview1,
  preview2,
  preview3,
  // Add more SVG paths as needed
]

export default function Home() {
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0)
  
  const account = useAccount()
  const { connectors, connect } = useConnect()
  // const { disconnect } = useDisconnect()
  // const balance = useBalance({ address: account.address })

  /* Commented out since these are unused in the component
  const createWallet = useCallback(() => {
    const coinbaseWalletConnector = connectors.find(
      (connector) => connector.id === 'coinbaseWalletSDK',
    );
    if (coinbaseWalletConnector) {
      connect({ connector: coinbaseWalletConnector });
    }
  }, [connectors, connect]);

  const APP_ID = process.env.NEXT_PUBLIC_CDP_PROJECT_ID || '';

  function buildOneClickURL() {
    return `https://pay.coinbase.com/buy/one-click?appId=${APP_ID}&defaultAsset=ETH&defaultPaymentMethod=ACH_BANK_ACCOUNT&destinationWallets=[{"address":"${account.address}","blockchains":["base"]}]&fiatCurrency=usd&presetFiatAmount=25&quoteId=fund-wallet-button`;
  }
  */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPreviewIndex((prev) => 
        prev === PREVIEW_IMAGES.length - 1 ? 0 : prev + 1
      )
    }, 3000) // Change image every 3 seconds

    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      <Navbar />
      <main className="container mx-auto p-4 flex flex-col items-center gap-8">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold mt-8 mb-4">Visarely Punks</h1>
          <p className="text-gray-600 text-lg px-4">
            A generative art collection merging Victor Vasarely's optical art mastery with CryptoPunks' iconic aesthetic. Each piece features mathematically-derived wave patterns hosting unique punk characters with varying traits. From 8-piece grids to dense 24-character compositions, every mint produces distinct arrangements determined by the minter's address.
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
        
        <Button 
          className="w-[200px]"
          disabled={!account.isConnected}
        >
          {account.isConnected ? 'Mint NFT' : 'Connect Wallet to Mint'}
        </Button>
      </main>
    </div>
  );
}
