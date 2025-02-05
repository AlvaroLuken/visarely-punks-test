'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useContractRead } from 'wagmi'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createPublicClient, http, erc20Abi } from 'viem'
import { base } from 'viem/chains'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract'

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`
if (!USDC_ADDRESS) {
  throw new Error('USDC_ADDRESS not found in environment variables')
}

const MINT_PRICE = 500_000_000n // 500 USDC

const customHttpTransport = http("/api/alchemy");

const publicClient = createPublicClient({
  chain: base,
  transport: customHttpTransport,
});

interface MintDialogProps {
  isOpen: boolean
  onClose: () => void
  onMintSuccess: (tokenId: number) => void
  viewMode?: boolean
  existingTokenId?: number
}

export function MintDialog({ isOpen: initialIsOpen, onClose, onMintSuccess }: MintDialogProps) {
  const { address } = useAccount()
  const [isOpen, setIsOpen] = useState(initialIsOpen)
  const [error] = useState<string>()
  const [tokenId, setTokenId] = useState<number>()
  const [svgData, setSvgData] = useState<string>()
  const [localAllowance, setLocalAllowance] = useState<bigint>(0n)
  
  // Get current allowance
  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, CONTRACT_ADDRESS],
  })

  // Combine chain allowance with local state
  const effectiveAllowance = localAllowance || allowance || 0n

  // Approve USDC
  const { writeContract: approveUsdc, data: approveHash } = useWriteContract()
  
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = 
    useWaitForTransactionReceipt({
      hash: approveHash,
    })

  // Update local allowance immediately after approval
  useEffect(() => {
    if (isApproveSuccess) {
      setLocalAllowance(MINT_PRICE)
      // Refetch actual allowance in background
      refetchAllowance()
    }
  }, [isApproveSuccess, refetchAllowance])

  const handleApprove = async () => {
    try {
      approveUsdc({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, MINT_PRICE],
      })
    } catch (error) {
      console.error('Error approving USDC:', error)
    }
  }

  // Contract writes
  const { data: approvalHash } = useWriteContract()
  const { writeContract: writeMint, data: mintHash } = useWriteContract()

  // Transaction receipts
  useWaitForTransactionReceipt({
    hash: approvalHash,
  })
  const { isLoading: isMintLoading, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  })

  // Force dialog to stay open during and after mint
  const [forceOpen, setForceOpen] = useState(false)
  
  // Monitor mint loading and success to force dialog open
  useEffect(() => {
    if (isMintLoading || isMintSuccess) {
      setForceOpen(true)
    }
  }, [isMintLoading, isMintSuccess])

  // Sync with parent's isOpen prop
  useEffect(() => {
    setIsOpen(initialIsOpen)
  }, [initialIsOpen])

  // Handle NFT mint
  const handleMint = async () => {
    console.log('Starting mint process...')
    
    if (!address) {
      console.error('No wallet connected')
      return
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'mint',
        account: address,
      })
      console.log('Simulation successful, sending transaction...')

      writeMint(request)
    } catch (error) {
      console.error('Error in mint process:', error)
    }
  }

  // Add this to help debug
  useEffect(() => {
    console.log('Contract state:', {
      address,
      CONTRACT_ADDRESS,
      effectiveAllowance,
      MINT_PRICE,
      isMintLoading,
      mintHash,
      error: error
    })
  }, [address, effectiveAllowance, isMintLoading, mintHash, error])

  // Add this effect to monitor the transaction
  useEffect(() => {
    if (mintHash) {
      console.log('Mint transaction sent:', mintHash)
    }
  }, [mintHash])

  // Monitor mint status
  useEffect(() => {
    if (isMintLoading) {
      console.log('Mint transaction in progress...')
    }
    if (isMintSuccess && mintHash) {
      console.log('Mint successful, getting transaction receipt...')
      publicClient.getTransactionReceipt({ hash: mintHash })
        .then(async (receipt) => {
          console.log('Full receipt:', receipt)
          
          const total = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'totalMinted',
          })
          
          const newTokenId = Number(total)
          console.log('New token ID:', newTokenId)
          setTokenId(newTokenId)
          await fetchNFTData(newTokenId)
          onMintSuccess(newTokenId)
        })
        .catch(console.error)
    }
  }, [isMintLoading, isMintSuccess, mintHash])

  // Fetch NFT data
  const fetchNFTData = async (tokenId: number) => {
    try {
      console.log('Fetching token URI for:', tokenId)
      const uri = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'tokenURI',
        args: [BigInt(tokenId)]
      })
      console.log('Raw token URI:', uri)

      let jsonMetadata;

      if (uri.startsWith('data:application/json;base64,')) {
        // Decode base64-encoded JSON metadata
        const jsonString = atob(uri.split(',')[1])
        jsonMetadata = JSON.parse(jsonString)
      } else if (uri.startsWith('{')) {
        // If it's already a JSON string, parse it directly
        jsonMetadata = JSON.parse(uri)
      } else if (uri.startsWith('http')) {
        // If it's a URL, fetch metadata from it
        const response = await fetch(uri)
        jsonMetadata = await response.json()
      } else {
        throw new Error('Unsupported tokenURI format')
      }

      console.log('Decoded Metadata:', jsonMetadata)

      if (jsonMetadata.image) {
        setSvgData(jsonMetadata.image)
      } else {
        throw new Error('Metadata does not contain an image field')
      }
    } catch (e) {
      console.error('Error fetching token URI:', e)
    }
  }

  const renderButton = () => {
    if (!address) {
      return <Button disabled>Connect Wallet to Mint</Button>
    }

    if (isApproveLoading) {
      return (
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Approving USDC...
        </Button>
      )
    }

    if (effectiveAllowance < MINT_PRICE) {
      return (
        <Button onClick={handleApprove}>
          Approve USDC
        </Button>
      )
    }

    if (isMintLoading) {
      return (
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Minting...
        </Button>
      )
    }

    return (
      <Button onClick={handleMint}>
        Mint NFT
      </Button>
    )
  }

  return (
    <Dialog 
      open={forceOpen || isOpen}
      onOpenChange={(open) => {
        // Allow closing if:
        // 1. No wallet connected
        // 2. Not in middle of transaction
        // 3. After mint success
        if (!open && (!address || (!isMintLoading && !isApproveLoading) || isMintSuccess)) {
          setForceOpen(false)
          onClose()
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-[600px]"
        onEscapeKeyDown={(e) => {
          // Only prevent escape if we're in the middle of minting or approving
          if (isMintLoading || isApproveLoading) {
            e.preventDefault()
          }
        }}
        onPointerDownOutside={(e) => {
          // Only prevent clicking outside if we're in the middle of minting or approving
          if (isMintLoading || isApproveLoading) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            {isMintSuccess && tokenId ? 
              `Successfully Minted #${tokenId}!` : 
              'Mint Your NFT'
            }
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6">
          {isMintSuccess && tokenId && svgData ? (
            <>
              <div className="w-80 h-80 rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={svgData}
                  alt={`Visarely Punk #${tokenId}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col w-full gap-3">
                <Button
                  onClick={() => window.open(`https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${tokenId}`, '_blank')}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <img 
                    src="/opensea.svg" 
                    alt="OpenSea" 
                    className="w-5 h-5"
                  />
                  See on OpenSea
                </Button>
                <Button
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=Just minted Visarely Punk %23${tokenId}! 🎨&url=https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${tokenId}`, '_blank')}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Share on X
                </Button>
              </div>
            </>
          ) : (
            <>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              {renderButton()}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 