'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function MintDialog({ 
  isOpen, 
  onClose,
  onMintSuccess,
  viewMode,
  existingTokenId
}: { 
  isOpen: boolean
  onClose: () => void
  onMintSuccess: (tokenId: number) => void
  viewMode?: boolean
  existingTokenId?: number
}) {
  const { address } = useAccount()
  const [tokenId, setTokenId] = useState<number>()
  const [error, setError] = useState<string>()
  const [imageUrl, setImageUrl] = useState<string>()
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  
  const { isLoading, isSuccess, error: waitError, data: receipt } = useWaitForTransactionReceipt({
    hash,
    timeout: 30_000,
  })

  useEffect(() => {
    if (viewMode && existingTokenId) {
      setTokenId(existingTokenId)
      fetchTokenURI(existingTokenId)
    }
  }, [viewMode, existingTokenId])

  useEffect(() => {
    if (receipt) {
      try {
        const transferLog = receipt.logs.find(log => 
          log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
        )
        
        if (transferLog && transferLog.topics[3]) {
          const newTokenId = parseInt(transferLog.topics[3], 16)
          setTokenId(newTokenId)
          fetchTokenURI(newTokenId)
        }
      } catch (e) {
        console.error('Error parsing token ID:', e)
        setError('Failed to get token ID')
      }
    }
  }, [receipt])

  async function fetchTokenURI(tokenId: number) {
    try {
      const response = await fetch(`/api/nft/${tokenId}`)
      if (response.ok) {
        const data = await response.text()
        setImageUrl(data)
      }
    } catch (e) {
      console.error('Error fetching token URI:', e)
    }
  }

  const handleMint = async () => {
    if (!address) {
      setError('Please connect your wallet first')
      return
    }

    try {
      setError(undefined)
      const tx = await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'mintTo',
        args: [address],
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mint')
    }
  }

  const displayError = error || writeError?.message || waitError?.message

  const tweetIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Just minted my Visarely Punk #${tokenId}! 🎨\n\nhttps://basescan.org/token/${CONTRACT_ADDRESS}/${tokenId}`
  )}`

  const openSeaUrl = tokenId ? 
    `https://testnets.opensea.io/assets/base_sepolia/${CONTRACT_ADDRESS}/${tokenId}` : 
    undefined

  const handleClose = () => {
    if (!viewMode && tokenId && isSuccess) {
      onMintSuccess(tokenId)
    }
    onClose()
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && isSuccess) {
          handleClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            {!hash ? 'Mint Your NFT' : 
             isLoading ? 'Processing Transaction...' : 
             isSuccess ? `Successfully Minted #${tokenId}!` : 
             'Something went wrong'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {displayError && (
            <p className="text-red-500 text-sm">{displayError}</p>
          )}
          
          {!hash ? (
            <Button onClick={handleMint} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirm in Wallet
                </>
              ) : (
                'Mint NFT'
              )}
            </Button>
          ) : isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-gray-500">
                Transaction in progress...
              </p>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center gap-6">
              <p className="text-xl font-bold">
                Visarely Punk #{tokenId}
              </p>
              <div className="w-80 h-80 rounded-lg overflow-hidden bg-gray-100">
                {imageUrl ? (
                  <div 
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{ __html: imageUrl }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 w-full">
                <Button asChild className="w-full py-6">
                  <a href={tweetIntent} target="_blank" rel="noopener noreferrer">
                    Share on Twitter
                  </a>
                </Button>
                <Button 
                  asChild 
                  variant="outline"
                  className="w-full py-6"
                >
                  <a 
                    href={openSeaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <img 
                      src="/opensea.svg" 
                      alt="OpenSea" 
                      className="w-5 h-5"
                    />
                    View on OpenSea
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-red-500">Transaction failed. Please try again.</p>
              <Button onClick={handleMint} className="mt-4">
                Retry Mint
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 