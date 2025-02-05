'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from 'react'
import { createPublicClient, http, formatUnits } from 'viem'
import { sepolia } from 'viem/chains'
import { AAVE_POOL_ADDRESS, TREASURY_ADDRESS, AUSDC_ADDRESS, USDC_ADDRESS } from '../lib/constants'

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
})

// Update the ABI to include getReserveData
const AAVE_POOL_ABI = [
  {
    "inputs": [{ "name": "asset", "type": "address" }],
    "name": "getReserveData",
    "outputs": [
      {
        "components": [
          { "name": "configuration", "type": "uint256" },
          { "name": "liquidityIndex", "type": "uint128" },
          { "name": "currentLiquidityRate", "type": "uint128" },
          { "name": "variableBorrowIndex", "type": "uint128" },
          { "name": "currentVariableBorrowRate", "type": "uint128" },
          { "name": "currentStableBorrowRate", "type": "uint128" },
          { "name": "lastUpdateTimestamp", "type": "uint40" },
          { "name": "id", "type": "uint16" },
          { "name": "aTokenAddress", "type": "address" },
          { "name": "stableDebtTokenAddress", "type": "address" },
          { "name": "variableDebtTokenAddress", "type": "address" },
          { "name": "interestRateStrategyAddress", "type": "address" },
          { "name": "accruedToTreasury", "type": "uint128" },
          { "name": "unbacked", "type": "uint128" },
          { "name": "isolationModeTotalDebt", "type": "uint128" }
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// AToken (aUSDC) ABI
const ATOKEN_ABI = [
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export function InfoTabs() {
  const [treasuryBalance, setTreasuryBalance] = useState<string>()
  const [currentApy, setCurrentApy] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch balance
        const balance = await publicClient.readContract({
          address: AUSDC_ADDRESS,
          abi: ATOKEN_ABI,
          functionName: 'balanceOf',
          args: [TREASURY_ADDRESS]
        })

        // Fetch reserve data for APY
        const reserveData = await publicClient.readContract({
          address: AAVE_POOL_ADDRESS,
          abi: AAVE_POOL_ABI,
          functionName: 'getReserveData',
          args: [USDC_ADDRESS]
        })

        // Calculate APY from liquidityRate (RAY = 1e27)
        const RAY = 10n ** 27n
        const liquidityRate = reserveData.currentLiquidityRate
        const depositAPR = (liquidityRate * 100n) / RAY
        const depositAPY = (((1 + Number(depositAPR) / 100 / 31536000) ** 31536000) - 1) * 100

        // Format values
        const formattedBalance = formatUnits(balance, 6)
        const formattedApy = depositAPY.toFixed(2)
        
        setTreasuryBalance(formattedBalance)
        setCurrentApy(formattedApy)
        setError(undefined)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch data')
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList className="grid w-full grid-cols-7 mb-8 h-auto p-1">
        <TabsTrigger value="about" className="text-lg font-medium px-4 py-2">About</TabsTrigger>
        <TabsTrigger value="how" className="text-lg font-medium px-4 py-2">How It Works</TabsTrigger>
        <TabsTrigger value="details" className="text-lg font-medium px-4 py-2">Details</TabsTrigger>
        <TabsTrigger value="tokenomics" className="text-lg font-medium px-4 py-2">Tokenomics</TabsTrigger>
        <TabsTrigger value="treasury" className="text-lg font-medium px-4 py-2">Treasury</TabsTrigger>
        <TabsTrigger value="team" className="text-lg font-medium px-4 py-2">Team</TabsTrigger>
        <TabsTrigger value="faq" className="text-lg font-medium px-4 py-2">FAQ</TabsTrigger>
      </TabsList>

      <div className="bg-white/50 backdrop-blur-md rounded-2xl p-8 shadow-sm">
        <div className="min-h-[400px] flex items-center justify-center">
          <TabsContent value="about" className="mt-0 w-full">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">The Vision</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Visarely Punks combines the mathematical precision of Victor Vasarely&apos;s op art with
                  the rebellious spirit of CryptoPunks. Each piece is a unique composition where 
                  geometric patterns meet punk aesthetics.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">The Technology</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Built on Base, each NFT is generated on-chain using advanced SVG manipulation. 
                  The minter&apos;s address influences the final composition, ensuring true
                  randomness and uniqueness.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="how" className="mt-0 w-full">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-purple-600 mb-2">1</div>
                <h3 className="text-lg font-semibold text-gray-900">Connect Wallet</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Connect your wallet to get started. We support most major Web3 wallets.
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-purple-600 mb-2">2</div>
                <h3 className="text-lg font-semibold text-gray-900">Mint Your NFT</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Click mint and confirm the transaction. Your unique piece will be generated instantly.
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-purple-600 mb-2">3</div>
                <h3 className="text-lg font-semibold text-gray-900">View & Share</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  View your NFT on OpenSea and share it with the community on Twitter.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-0 w-full">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Project Phases</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="relative">
                  <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-purple-600 text-white text-sm font-medium px-3 py-1 rounded-full">Current</div>
                      <h4 className="text-lg font-semibold text-gray-900">Phase 1</h4>
                    </div>
                    <p className="text-gray-800 text-lg leading-relaxed">
                      Initial mint phase with open redemptions. Until the full 2000 NFT supply is minted, NFT owners can get a refund on their NFT (minus a 10% tax, which is kept by the Visarely Treasury).
                    </p>
                  </div>
                  <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">Upcoming</div>
                      <h4 className="text-lg font-semibold text-gray-900">Phase 2</h4>
                    </div>
                    <p className="text-gray-800 text-lg leading-relaxed">
                      Collection fully minted (2000 NFTs) and the treasury is fully funded with 1 million USDC. Redemptions are closed.
                    </p>
                  </div>
                  <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <div>
                  <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">Future</div>
                      <h4 className="text-lg font-semibold text-gray-900">Phase 3</h4>
                    </div>
                    <p className="text-gray-800 text-lg leading-relaxed">
                      The Visarely Treasury moves to a DAO-based governance structure. Community-driven initiatives and expansion. New features and opportunities voted by DAO members.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tokenomics" className="mt-0 w-full">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Tokenomics</h3>
              <ul className="text-gray-800 text-lg leading-relaxed list-disc pl-6">
                <li>Visarely Punks is a collection of NFTs with a total supply of 2000.</li>
                <li>100% of mint proceeds are allocated to the Visarely Treasury. The treasury is intially fully owned by the Visarely team, with the intention to move to a DAO-based governance structure.</li>
                <li>2.5% of secondary market sales go directly to the Visarely Treasury (as long as suggested royalties are respected).</li>
              </ul>
              <div className="grid md:grid-cols-3 gap-8 mt-8">
                <div className="text-center p-6 rounded-lg bg-gray-50/80 backdrop-blur-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Distribution</h4>
                  <p className="text-gray-800 text-lg">2000 NFTs are for sale at 500 USDC each. The collection is fully "official" when 2000 NFTs are minted, otherwise holders can get a refund on their NFT (minus a 10% tax, which is kept by the Visarely Treasury).</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-gray-50/80 backdrop-blur-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Utility</h4>
                  <p className="text-gray-800 text-lg">No real utility. The collection is purely for aesthetic and community-building purposes. The goal is to have fun and increase the wealth of the Visarely Treasury. A primary goal is to protect the 500 USDC principal and only take on investment opportunities that will increase the treasury value (and hence increase the value of a Visarely Punk beyond 500 USDC).</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-gray-50/80 backdrop-blur-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Vision</h4>
                  <p className="text-gray-800 text-lg">High school investment club vibes! With the treasury fully funded (1 million USDC!), investment opportunities open up beyond what one individual could participate in with 500 USDC. These opportunities can be: buying a CryptoPunk for 100k USDC, buying a 100k USDC position in a DeFi protocol, or other opportunities that are too expensive for one individual to participate in. The yields and profits go to the treasury, which is used to further fund investment opportunities. Owning a Visarely Punk means owning 1/2000th of the treasury.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="treasury" className="mt-0 w-full">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Treasury</h3>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-4">Current Treasury Balance</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <img 
                      src="/images/usdc-logo.svg"
                      alt="USDC" 
                      className="w-6 h-6"
                    />
                    <span className="text-2xl font-bold">
                      {treasuryBalance ? 
                        `${Number(treasuryBalance).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6
                        })} USDC` : 
                        'Loading...'
                      }
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Current Supply APY: {currentApy ? `${currentApy}%` : 'Loading...'}
                  </div>
                </div>
                {error && (
                  <p className="mt-2 text-red-500 text-sm">{error}</p>
                )}
                <p className="mt-4 text-sm text-gray-600">
                  All mint proceeds are automatically supplied to Aave v3 on Sepolia, earning yield for the DAO treasury.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-0 w-full">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-40 h-40 mx-auto rounded-full overflow-hidden bg-gray-100">
                  <img
                    src="/images/alvaro_luken_head_shot.jpg"
                    alt="Al Luken"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Al Luken</h3>
                  <p className="text-gray-800 text-lg leading-relaxed">Founder & Developer</p>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Al is crypto class of 2017. He lives and breathes NFTs. He is the main tinkerer behind Visarely Punks and just wants to have fun! The vision is: onchain investment club.
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <a 
                    href="https://x.com/lifeofbitcoin" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-800 hover:text-blue-600 transition-colors"
                  >
                    Follow @lifeofbitcoin
                  </a>
                </div>
              </div>
              <div className="text-center space-y-4">
                <div className="w-40 h-40 mx-auto rounded-full overflow-hidden bg-gray-100">
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Photo
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Jane Smith</h3>
                  <p className="text-gray-800 text-lg leading-relaxed">Creative Director</p>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Brief bio or description about the team member and their role in the project.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-40 h-40 mx-auto rounded-full overflow-hidden bg-gray-100">
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Photo
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Mike Johnson</h3>
                  <p className="text-gray-800 text-lg leading-relaxed">Technical Lead</p>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Brief bio or description about the team member and their role in the project.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faq" className="mt-0 w-full">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">What is Visarely Punks?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Sample answer explaining the project in detail.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">How do I mint an NFT?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Sample answer explaining the minting process.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">What makes each NFT unique?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Sample answer explaining the uniqueness factors.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">What blockchain is this on?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Sample answer about the blockchain technology used.
                </p>
              </div>
            </div>
          </TabsContent>
        </div>
      </div>
    </Tabs>
  )
} 