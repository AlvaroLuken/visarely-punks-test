'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useContractRead } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { Button } from "@/components/ui/button"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract'
import { Loader2 } from "lucide-react"

interface NFTData {
  id: number
  image: string
}

export function RedeemSection() {
  const { address, isConnected } = useAccount()
  const [ownedNFTs, setOwnedNFTs] = useState<NFTData[]>([])
  const [redeemingTokenId, setRedeemingTokenId] = useState<number>()

  // Get NFT balance
  const { data: balance } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'balanceOf',
    args: [address!],
    enabled: !!address,
  })

  // Contract writes
  const { writeContract: writeRedeem, data: redeemHash } = useWriteContract()

  // Transaction receipt
  const { isLoading: isRedeemLoading, isSuccess: isRedeemSuccess } = 
    useWaitForTransactionReceipt({
      hash: redeemHash,
    })

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address || !balance || balance === 0n) return

      try {
        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http()
        })

        const totalSupply = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'totalMinted',
        })

        const foundNFTs: NFTData[] = []

        // Check ownership and fetch metadata for each token
        for (let i = 1; i <= Number(totalSupply); i++) {
          try {
            const owner = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'ownerOf',
              args: [BigInt(i)]
            })

            if (owner.toLowerCase() === address.toLowerCase()) {
              const uri = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'tokenURI',
                args: [BigInt(i)]
              })

              let jsonMetadata;
              if (uri.startsWith('data:application/json;base64,')) {
                const jsonString = atob(uri.split(',')[1])
                jsonMetadata = JSON.parse(jsonString)
              } else if (uri.startsWith('{')) {
                jsonMetadata = JSON.parse(uri)
              }

              foundNFTs.push({
                id: i,
                image: jsonMetadata.image
              })
            }
          } catch (error) {
            console.error(`Error checking token ${i}:`, error)
          }
        }

        setOwnedNFTs(foundNFTs)
      } catch (error) {
        console.error('Error fetching NFTs:', error)
      }
    }

    fetchNFTs()
  }, [address, balance])

  const handleRedeem = async (tokenId: number) => {
    try {
      setRedeemingTokenId(tokenId)
      writeRedeem({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'redeem',
        args: [BigInt(tokenId)]
      })
    } catch (error) {
      console.error('Error redeeming NFT:', error)
      setRedeemingTokenId(undefined)
    }
  }

  useEffect(() => {
    if (isRedeemSuccess && redeemingTokenId) {
      setOwnedNFTs(prev => prev.filter(nft => nft.id !== redeemingTokenId))
      setRedeemingTokenId(undefined)
    }
  }, [isRedeemSuccess, redeemingTokenId])

  // Only show if wallet is connected and has NFTs
  if (!isConnected || !balance || balance === 0n) {
    return null
  }

  return (
    <main className="container mx-auto px-4 py-24">
      <div className="bg-white/50 backdrop-blur-md rounded-2xl p-8 shadow-sm">
        <h2 className="text-4xl font-bold mb-8 text-center">Redeem Your VisarelyPunk</h2>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-lg text-gray-800 text-center mb-8">
            As a VisarelyPunk holder, you can redeem your NFT to receive back 450 USDC from your initial 500 USDC deposit. 
            A 10% redemption tax is applied to support the DAO treasury.
          </p>

          <div className="grid gap-6">
            {ownedNFTs.map((nft) => (
              <div 
                key={nft.id}
                className="bg-white/70 rounded-lg p-6 flex items-center justify-between gap-6"
              >
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={nft.image}
                      alt={`VisarelyPunk #${nft.id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">VisarelyPunk #{nft.id}</h3>
                    <p className="text-gray-600">Available for redemption</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleRedeem(nft.id)}
                  disabled={isRedeemLoading && redeemingTokenId === nft.id}
                >
                  {isRedeemLoading && redeemingTokenId === nft.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    'Redeem for 450 USDC'
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Note: Redeeming your NFT will burn the token and return 450 USDC (90% of your initial deposit). 
              The 10% redemption tax remains in the DAO treasury. This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
} 