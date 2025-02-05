'use client'

import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TREASURY_ADDRESS, CONTRACT_ADDRESS } from '../lib/constants'

const ADMIN_ADDRESS = '0x80d123B954fe80A1BA67Ce72aBd791Ce25f7221C'

const TREASURY_ABI = [
  {
    name: 'withdrawForFounder',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    name: 'executeStrategy',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'data', type: 'bytes' }
    ],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

const PUNKS_ABI = [
  {
    name: 'dissolveDAO',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    name: 'emergencyDissolve',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    name: 'selfDestructCollection',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

export function AdminPanel() {
  const { address } = useAccount()
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [strategyTarget, setStrategyTarget] = useState('')
  const [strategyData, setStrategyData] = useState('')

  const { writeContract: writeTreasury } = useWriteContract()
  const { writeContract: writePunks } = useWriteContract()

  if (address?.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
    return null
  }

  const handleWithdraw = () => {
    writeTreasury({
      address: TREASURY_ADDRESS,
      abi: TREASURY_ABI,
      functionName: 'withdrawForFounder',
      args: [withdrawAddress as `0x${string}`, BigInt(withdrawAmount)]
    })
  }

  const handleExecuteStrategy = () => {
    writeTreasury({
      address: TREASURY_ADDRESS,
      abi: TREASURY_ABI,
      functionName: 'executeStrategy',
      args: [strategyTarget as `0x${string}`, strategyData as `0x${string}`]
    })
  }

  const handleDissolveDAO = () => {
    if (confirm('Are you sure you want to dissolve the DAO?')) {
      writePunks({
        address: CONTRACT_ADDRESS,
        abi: PUNKS_ABI,
        functionName: 'dissolveDAO'
      })
    }
  }

  const handleEmergencyDissolve = () => {
    if (confirm('Are you sure you want to emergency dissolve?')) {
      writePunks({
        address: CONTRACT_ADDRESS,
        abi: PUNKS_ABI,
        functionName: 'emergencyDissolve'
      })
    }
  }

  const handleSelfDestruct = () => {
    if (confirm('Are you sure you want to self destruct the collection?')) {
      writePunks({
        address: CONTRACT_ADDRESS,
        abi: PUNKS_ABI,
        functionName: 'selfDestructCollection'
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="bg-red-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-red-900 mb-8">Admin Panel</h2>
        
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-red-800">Treasury Actions</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="withdrawAmount">Withdraw Amount (in USDC)</Label>
                <Input
                  id="withdrawAmount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Amount in USDC"
                />
              </div>
              
              <div>
                <Label htmlFor="withdrawAddress">Withdraw To Address</Label>
                <Input
                  id="withdrawAddress"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              
              <Button 
                variant="destructive"
                onClick={handleWithdraw}
                className="w-full"
              >
                Withdraw USDC
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="strategyTarget">Strategy Target Address</Label>
                <Input
                  id="strategyTarget"
                  value={strategyTarget}
                  onChange={(e) => setStrategyTarget(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              
              <div>
                <Label htmlFor="strategyData">Strategy Call Data</Label>
                <Input
                  id="strategyData"
                  value={strategyData}
                  onChange={(e) => setStrategyData(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              
              <Button 
                variant="destructive"
                onClick={handleExecuteStrategy}
                className="w-full"
              >
                Execute Strategy
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-red-800">Emergency Actions</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <Button 
                variant="destructive"
                onClick={handleDissolveDAO}
              >
                Dissolve DAO
              </Button>
              
              <Button 
                variant="destructive"
                onClick={handleEmergencyDissolve}
              >
                Emergency Dissolve
              </Button>
              
              <Button 
                variant="destructive"
                onClick={handleSelfDestruct}
              >
                Self Destruct Collection
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 