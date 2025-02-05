import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'

const client = createPublicClient({
  chain: base,
  transport: http()
})

export async function GET(
  request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    console.log('Fetching token URI for ID:', params.tokenId)
    
    const tokenURI = await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'tokenURI',
      args: [BigInt(params.tokenId)]
    }) as string

    console.log('Raw tokenURI:', tokenURI)

    // Remove the data:application/json;base64, prefix
    const base64Data = tokenURI.replace('data:application/json;base64,', '')
    const jsonData = JSON.parse(atob(base64Data))
    
    console.log('Decoded metadata:', jsonData)

    // Extract SVG directly from the image property
    const svgData = Buffer.from(
      jsonData.image.replace('data:image/svg+xml;base64,', ''), 
      'base64'
    ).toString()

    console.log('SVG data length:', svgData.length)

    return new NextResponse(svgData, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      },
    })
  } catch (error) {
    console.error('Detailed error:', {
      error,
      tokenId: params.tokenId,
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    return new NextResponse('Error fetching NFT data', { status: 500 })
  }
} 