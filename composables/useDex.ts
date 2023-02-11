import { USDCAddress, WBTCAddress, DOBAddress } from 'deorderbook-sdk'

type ActionType = 'swap' | 'add'
interface Tokens {
  USDC: string
  WBTC: string
  DOB: string
  ETH: string
}

export const useDex = () => {
  const marketName = 'Uniswap'
  const tokens: Readonly<Tokens> = {
    USDC: USDCAddress,
    WBTC: WBTCAddress,
    DOB: DOBAddress,
    ETH: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
  }
  const goDex = (
    outputCurrency: keyof Tokens,
    type: ActionType = 'swap',
    inputCurrency: keyof Tokens = 'USDC'
  ) => {
    window.open(
      `https://app.uniswap.org/#/${type}?inputCurrency=${tokens[inputCurrency]}&outputCurrency=${tokens[outputCurrency]}`
    )
  }
  return {
    ...tokens,
    goDex,
    marketName,
  }
}
