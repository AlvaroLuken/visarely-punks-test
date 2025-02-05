import preview1 from '../images/preview1.svg'
import preview2 from '../images/preview2.svg'
import preview3 from '../images/preview3.svg'
import preview4 from '../images/preview4.svg'
import preview5 from '../images/preview5.svg'

export const PREVIEW_IMAGES = [
  preview1,
  preview2,
  preview3,
  preview4,
  preview5,
]

// Validate environment variables
if (!process.env.NEXT_PUBLIC_AAVE_POOL_ADDRESS) {
  throw new Error('NEXT_PUBLIC_AAVE_POOL_ADDRESS not found in environment variables')
}
if (!process.env.NEXT_PUBLIC_TREASURY_ADDRESS) {
  throw new Error('NEXT_PUBLIC_TREASURY_ADDRESS not found in environment variables')
}
if (!process.env.NEXT_PUBLIC_AUSDC_ADDRESS) {
  throw new Error('NEXT_PUBLIC_AUSDC_ADDRESS not found in environment variables')
}

export const AAVE_POOL_ADDRESS = process.env.NEXT_PUBLIC_AAVE_POOL_ADDRESS as `0x${string}`
export const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`
export const AUSDC_ADDRESS = process.env.NEXT_PUBLIC_AUSDC_ADDRESS as `0x${string}` 
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`

export { CONTRACT_ADDRESS, CONTRACT_ABI } from './contract'