'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from 'react'
import { createPublicClient, http, formatUnits } from 'viem'
import { base } from 'viem/chains'
import { AAVE_POOL_ADDRESS, TREASURY_ADDRESS, AUSDC_ADDRESS, USDC_ADDRESS } from '../lib/constants'

const customHttpTransport = http("/api/alchemy");

export const publicClient = createPublicClient({
  chain: base,
  transport: customHttpTransport,
});

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
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 mb-8 h-auto p-1 overflow-x-auto gap-1">
        <TabsTrigger value="about" className="text-lg font-medium px-4 py-2 whitespace-nowrap">About</TabsTrigger>
        <TabsTrigger value="how" className="text-lg font-medium px-4 py-2 whitespace-nowrap">How It Works</TabsTrigger>
        <TabsTrigger value="details" className="text-lg font-medium px-4 py-2 whitespace-nowrap">Details</TabsTrigger>
        <TabsTrigger value="tokenomics" className="text-lg font-medium px-4 py-2 whitespace-nowrap">Tokenomics</TabsTrigger>
        <TabsTrigger value="treasury" className="text-lg font-medium px-4 py-2 whitespace-nowrap">Treasury</TabsTrigger>
        <TabsTrigger value="team" className="text-lg font-medium px-4 py-2 whitespace-nowrap">Team</TabsTrigger>
        <TabsTrigger value="faq" className="text-lg font-medium px-4 py-2 whitespace-nowrap">FAQ</TabsTrigger>
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
                  Built on Base, each NFT is generated onchain using advanced SVG manipulation. 
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
                      Collection fully minted (2000 NFTs) and the treasury is fully funded with 1 million USDC. Redemptions are closed. Treasury is fully owned by the Visarely team.
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
                <li>Until all 2000 NFTs are minted, the collection will be considered &quot;pre-launch&quot; and holders can get a refund on their NFT (minus a 10% tax, which is kept by the Visarely Treasury).</li>
                <li>100% of mint proceeds are allocated to the Visarely Treasury. The treasury is intially fully owned by the Visarely team, with the intention to move to a DAO-based governance structure.</li>
                <li>2.5% of all secondary market sales go directly to the Visarely Treasury (as long as royalties are respected).</li>
                <li>All USDC is immediately supplied to Aave v3, earning yield for the DAO treasury.</li>
                <li>The goal is to make the Visarely Treasury RICH!</li>
              </ul>
              <div className="grid md:grid-cols-3 gap-8 mt-8">
                <div className="text-center p-6 rounded-lg bg-gray-50/80 backdrop-blur-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Distribution</h4>
                  <p className="text-gray-800 text-lg space-y-4">
                    <span className="block">2000 NFTs are for sale at 500 USDC each.</span>
                    <span className="block">Until all 2000 NFTs are minted, the collection will be considered &quot;pre-launch&quot; and holders can get a refund on their NFT (minus a 10% tax, which is kept by the Visarely Treasury).</span>
                  </p>
                </div>
                <div className="text-center p-6 rounded-lg bg-gray-50/80 backdrop-blur-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Utility</h4>
                  <p className="text-gray-800 text-lg">
                    No real utility. The collection is purely for aesthetic and community-building purposes.<br /><br />
                    The goal is to have fun and increase the value and wealth of the Visarely Treasury.<br /><br />
                    Each NFT is worth 500 USDC and a main goal of this project is to preserve that value indefinitely. 1/2000th of the treasury should always be worth at least 500 USDC. The treasury will take on investment opportunities that will increase the treasury value; and hence increase the value of a Visarely Punk beyond 500 USDC ��.
                  </p>
                </div>
                <div className="text-center p-6 rounded-lg bg-gray-50/80 backdrop-blur-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Vision</h4>
                  <p className="text-gray-800 text-lg">
                    High school investment club vibes! With the treasury fully funded (1 million USDC!), investment opportunities open up beyond what one individual could participate in with 500 USDC.<br /><br />
                    These opportunities can be: buying a CryptoPunk for 100k USDC, buying a 100k USDC position in a DeFi protocol, or other opportunities that are too expensive for one individual to participate in.<br /><br />
                    The yields and profits go to the treasury, which is used to further fund investment opportunities. Owning a Visarely Punk means owning 1/2000th of the treasury.<br /><br />
                    The team also wants to create Visarely Punk merchandise and swag exclusive to Visarely Punks holders. 👀
                  </p>
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
                          maximumFractionDigits: 2
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
                  All mint proceeds are automatically supplied to Aave v3 on Base, earning yield for the DAO treasury.
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
                  <img
                    src="/images/coco.jpeg"
                    alt="Coco"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Coco</h3>
                  <p className="text-gray-800 text-lg leading-relaxed">Chief Woof Officer</p>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Coco was in charge of providing woofs and pets during the critical development phase of Visarely Punks.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-40 h-40 mx-auto rounded-full overflow-hidden bg-gray-100">
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Photo
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">TBD</h3>
                  <p className="text-gray-800 text-lg leading-relaxed">TBD</p>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Been wanting to be on the team of an up-and-coming NFT project? DM me on X.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faq" className="mt-0 w-full">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">What is Visarely Punks?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Visarely Punks is a collection of 2000 unique NFTs, each generated onchain using advanced SVG manipulation. The minter&apos;s address influences the final composition, ensuring true randomness and uniqueness.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">How do I mint an NFT?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  You must have 500 USDC in your wallet to mint an NFT. To mint an NFT, connect your wallet to the Visarely Punks website, select the Mint NFT button, and confirm the transaction. The minting process is near-instant and the NFT will be added to your wallet.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">What makes each NFT unique?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Each NFT is generated onchain using advanced SVG manipulation. The minter&apos;s address influences the final composition, ensuring true randomness and uniqueness. The final NFT could be a simple (but beautiful) geometric pattern, an alien with a top hat, or a combination of both. The combinations are endless!
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">What do you mean all mint proceeds are deposited into Aave?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  In order to immediately increase the treasury value, all mint proceeds are deposited into Aave v3 on Base. Aave FTW!!!! Onchain yield babyyyyy! What other NFT project focuses on immediately increasing the treasury value huh?!?!
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">How is this project different from other NFT projects?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Well, for one, the primary sales are immediately deposited into Aave v3 on Base to immediately start making the NFT project itself richer. Every other NFT mint you&apos;ve ever participated in has it so that the primary market sales AND secondary market sales go into the founder wallet for completely mysterious reasons. Are they going to use those funds to grow the NFT project or buy a lambo for the founding team? This project is different, I just want to make the NFT project itself richer indefinitely and see where that goes. I don&apos;t pay myself anything of course, I&apos;m just in this for the fun and life XP.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">As a Visarely Punk holder, what do I get?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Initially, you just get a beautiful and unique NFT (you should set it as your profile picture on X!). The goal is to move to a DAO-based governance where each NFT can vote 1:1 on what to do with the treasury. The more Visarely Punks one owns, the more power they have in the DAO. Initially, the Visarely team has full control of the treasury to ensure a smooth and secure transition to DAO-based governance. Don&apos;t worry, the goal is to make the treasury rich indefinitely, whoever owns it, so that Visarely Punk NFTs consequentially increase in value. The founder team is fully doxed and has ZERO interest in rug pulling.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Tell me more about the Visarely team...</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                 It&apos;s really just me, broh. Al Luken. I&apos;m just a regular dude and I love NFTs - been an avid collector and enthusiast for years - and this is my way of playing with NFTs in a way that I never have. Keep in mind, I have a full-time job so this is a hobby project for me! If you want to get involved, hit me up on X. I coded this entire project up, including smart contracts and website, in about 2 weeks.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">What should I expect from Visarely Punks?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Tbh bruh, I don&apos;t know what to expect. The one thing you can be sure of is I have no interest in scamming you or anyone. I don&apos;t really stand to gain much by running this project except some life XP. And to have fun and meet awesome new people interested in playing cool onchain games with me.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Is this risky?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  I would say so! Things can always go wrong in the Wild West of Web3. I&apos;ve taken strenuous measures to ensure the safety of the treasury and the project but I can&apos;t anticipate everything. You&apos;ll notice the smart contract has a lot of checks and balances to ensure the safety of the treasury and the project, including functions specific to protecting funds in the Visarely treasury by withdrawing them in case of emergency. If I ever need to withdraw them, I would just airdrop the USDC back to all Visarely Punk holders. <b>Invest only what you can afford to lose.</b>
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Will there be exclusive groups for Visarely Punks holders?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Heck yeah! We&apos;ll set up an exclusive Telegram group exclusive to Visarely Punks holders.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Will there be exclusive merch for Visarely Punks holders?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Yes. This is Al Luken typing this: one thing I always hated about NFT projects is that I would pay these crazy amounts of money for the NFT and never even see some swag?!?! Bro, some cheap cotton hoodies cost like $20 to make. When the time is right, a snapshot will be taken and Visarely Punk holders will be able to redeem some swag.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">What blockchain is this on?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  This is on Base.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">What do you mean I can get a refund on my NFT?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  If you mint an NFT and the collection is not fully minted, you can get a refund on your NFT (minus a 10% tax, which is kept by the Visarely Treasury).
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">How do I get a refund on my Visarely Punk?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  You must own a Visarely Punk and the collection must not yet be fully minted. Simply reload the page and the Redeem Your Visarely Punk section will appear. Select the NFT you want to redeem and confirm the transaction. You will get 450 USDC back to your wallet.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Are the smart contracts verified?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Yep. You can view the contracts on BaseScan. VisarelyPunks NFT contract: <a href="https://basescan.org/address/0xd183659D1f99871247Eb2F45D00e35fd9842AeBc" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">https://basescan.org/address/0xd183659D1f99871247Eb2F45D00e35fd9842AeBc</a> and Visarely Treasury contract: <a href="https://basescan.org/address/0x31983e242C375bbf1E910068670464E70b985708" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">https://basescan.org/address/0x31983e242C375bbf1E910068670464E70b985708</a>.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">How long will it take to mint all 2000 Visarely Punks?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Who knows?! It might be that they mint out in a few days, or it might take a few months. Or never. And I&apos;m fine with that. If it&apos;s meant to be, it will be. If not, this was a fun experiment.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Why Visarely?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  It sounds cool! Initially, the idea was to make the art a bit more grid-like and wave-patterned, where each NFT would have a ton of little Visarely Punks floating around in cool placements (replicating Victor Visarely&apos;s optical art). But they came out so cute and cool that I decided to make them PFPs.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">I minted a Visarely Punk and I don&apos;t like it.</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Bummer! You can get a refund on your NFT (minus a 10% tax, which is kept by the Visarely Treasury). Just reload the page and the Redeem Your Punk section will appear. Select the NFT you want to redeem and confirm the transaction. You will get 450 USDC back to your wallet.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Can I still get 450 USDC back on my NFT AFTER the collection is fully minted?</h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  Nope! The refund is only available if the collection is not fully minted. When the treasury becomes DAO-owned, nothing stops you from submitting a proposal, for the DAO&apos;s approval, to refund your NFT for 450 USDC though. 🤷‍♂️
                </p>
              </div>
            </div>
          </TabsContent>
        </div>
      </div>
    </Tabs>
  )
} 