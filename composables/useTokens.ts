import { getTokenBySymbol } from 'deorderbook-sdk'
import Big from 'big.js'

import IconUSDC from '~/assets/img/icon_usdc@2x.png'
import IconWBTC from '~/assets/img/icon_wbtc@2x.png'
import IconUHODL from '~/assets/img/icon_coin_uHODL@2x.png'
import IconBHODL from '~/assets/img/icon_bhodl@2x.png'
import IconDOB from 'assets/img/icon_coin_dob@2x.png'
import IconBBULLET from '~/assets/img/icon_b_bullet@2x.png'
import IconUBULLET from '~/assets/img/icon_coin_uBullet@2x.png'
import IconBSNIPER from '~/assets/img/icon_b_sniper@2x.png'
import IconUSNIPER from '~/assets/img/icon_coin_uSniper@2x.png'

/** 获取bullet价格接口参数 */
interface BulletPriceParams {
  /** 行权时间，单位秒 */
  exerciseTimestamp: string
  /** 行权价格，需要除以精度 */
  strikePrice: string
  /** bullet address */
  address: string
}
/** 获取Sniper价格接口参数 */
interface SniperPriceParams {
  /** 行权价格，需要除以精度 */
  strikePrice: string
  /** sniper address */
  address: string
}

const tokenEnums = {
  USDC: {
    symbol: 'USDC',
    icon: IconUSDC,
    pairToken: 'uHODL',
    address: getTokenBySymbol('USDC').address,
    USDExchangeRate: getTokenBySymbol('USDC').USDExchangeRate,
  },
  WBTC: {
    symbol: 'WBTC',
    icon: IconWBTC,
    pairToken: 'bHODL',
    address: getTokenBySymbol('WBTC').address,
    USDExchangeRate: getTokenBySymbol('WBTC').USDExchangeRate,
  },
  uHODL: {
    symbol: 'uHODL',
    icon: IconUHODL,
    pairToken: 'USDC',
    address: getTokenBySymbol('uHODL').address,
    USDExchangeRate: getTokenBySymbol('uHODL').USDExchangeRate,
  },
  bHODL: {
    symbol: 'bHODL',
    icon: IconBHODL,
    pairToken: 'WBTC',
    address: getTokenBySymbol('bHODL').address,
    USDExchangeRate: getTokenBySymbol('bHODL').USDExchangeRate,
  },
  DOB: {
    symbol: 'DOB',
    icon: IconDOB,
    address: getTokenBySymbol('DOB').address,
    USDExchangeRate: getTokenBySymbol('DOB').USDExchangeRate,
  },
  uBULLET: {
    symbol: 'uBULLET',
    icon: IconUBULLET,
    USDExchangeRate: async (params: Omit<BulletPriceParams, 'address'>) => {
      const { exerciseTimestamp, strikePrice } = params
      // 服务器已经对该接口进行了1分钟的缓存
      return await $fetch(
        `https://35.82.30.121/api/core/price/?bullet_name=uBullet_${exerciseTimestamp}_${strikePrice}`
      ).then((res: any) => res.data.price || '0')
    },
  },
  bBULLET: {
    symbol: 'bBULLET',
    icon: IconBBULLET,
    USDExchangeRate: async (params: Omit<BulletPriceParams, 'address'>) => {
      const { exerciseTimestamp, strikePrice } = params
      // 服务器已经对该接口进行了1分钟的缓存
      return await $fetch(
        `https://35.82.30.121/api/core/price/?bullet_name=bBullet_${exerciseTimestamp}_${strikePrice}`
      ).then((res: any) => res.data.price || '0')
    },
  },
  uSNIPER: {
    symbol: 'uSNIPER',
    icon: IconUSNIPER,
    USDExchangeRate: async (params: Omit<SniperPriceParams, 'address'>) => {
      const { strikePrice } = params
      const BTCPrice = await getTokenBySymbol('WBTC').USDExchangeRate()
      return BTCPrice > Number(strikePrice)
        ? '1'
        : Big(BTCPrice).div(strikePrice).toFixed()
    },
  },
  bSNIPER: {
    symbol: 'bSNIPER',
    icon: IconBSNIPER,
    USDExchangeRate: async (params: Omit<SniperPriceParams, 'address'>) => {
      const { strikePrice } = params
      const BTCPrice = await getTokenBySymbol('WBTC').USDExchangeRate()
      return BTCPrice > Number(strikePrice) ? strikePrice : String(BTCPrice)
    },
  },
} as const
export type TokenSymbols = keyof typeof tokenEnums
export default () => {
  /**
   * @description mint或者redeem的token对
   * @param {string} symbol
   * @return {*}
   */
  const getTokenPair = (
    symbol: Exclude<
      TokenSymbols,
      'DOB' | 'uBULLET' | 'bBULLET' | 'uSNIPER' | 'bSNIPER'
    >
  ) => {
    return tokenEnums[symbol]?.pairToken
  }
  const getTokenBuyOrSellPair = (
    symbol: 'uHODL' | 'bHODL' | 'WBTC' | 'USDC'
  ) => {
    const tokenEnums = {
      uHODL: 'WBTC',
      bHODL: 'USDC',
      WBTC: 'uHODL',
      USDC: 'bHODL',
    }
    return tokenEnums[symbol]
  }
  const getTokenIcon = (symbol: TokenSymbols) => {
    return tokenEnums[symbol].icon
  }
  const getTokenBalance = (
    symbol: 'USDC' | 'WBTC' | 'uHODL' | 'bHODL' | 'DOB'
  ) => {
    const { tokenBalance } = toRefs(useWalletStore())
    const balanceEnums = {
      USDC: tokenBalance.value.balanceUSDC,
      WBTC: tokenBalance.value.balanceWBTC,
      uHODL: tokenBalance.value.balanceUHODL,
      bHODL: tokenBalance.value.balanceBHODL,
      DOB: tokenBalance.value.balanceDOB,
    }

    return computed(() => {
      return balanceEnums[symbol]
    })
  }

  /**
   * 获取token的美元价格
   * @notice 只应该使用在store中，其他使用场景应该使用getTokenPrice
   */
  const getTokenUSD = (
    symbol: TokenSymbols,
    amount = '1',
    params?:
      | Omit<BulletPriceParams, 'address'>
      | Omit<SniperPriceParams, 'address'>
      | undefined
  ): Promise<string> => {
    let _params = undefined as
      | undefined
      | Omit<BulletPriceParams, 'address'>
      | Omit<SniperPriceParams, 'address'>
    if (symbol === 'bBULLET' || symbol === 'uBULLET') {
      _params = params as Omit<BulletPriceParams, 'address'>
    } else if (symbol === 'bSNIPER' || symbol === 'uSNIPER') {
      _params = params as Omit<SniperPriceParams, 'address'>
    }

    return tokenEnums[symbol].USDExchangeRate(_params).then((rate: string) => {
      return Big(rate || 0)
        .times(amount)
        .toFixed()
    })
  }

  /** 获取token的美元价格 */
  const getTokenPrice = (
    symbol: TokenSymbols,
    params?: BulletPriceParams | SniperPriceParams
  ) => {
    const { tokenDOB, tokenWBTC, tokenUHODL, tokenUSDC, tokenBHODL } = toRefs(
      useTokensStore()
    )
    const { getBulletPrice, getSniperPrice } = toRefs(useTokensStore())
    const tokenEnums = {
      DOB: tokenDOB,
      WBTC: tokenWBTC,
      USDC: tokenUSDC,
      uHODL: tokenUHODL,
      bHODL: tokenBHODL,
    }
    if (symbol === 'uBULLET' || symbol === 'bBULLET') {
      const _params = params as BulletPriceParams
      return computedAsync(async () => {
        const value = await getBulletPrice.value(
          symbol,
          _params.strikePrice,
          _params.exerciseTimestamp,
          _params.address
        )
        return value.value?.priceUSD || '0'
      }, '0')
    } else if (symbol === 'uSNIPER' || symbol === 'bSNIPER') {
      const _params = params as SniperPriceParams
      return computedAsync(async () => {
        const value = await getSniperPrice.value(
          symbol,
          _params.strikePrice,
          _params.address
        )
        return value.value?.priceUSD || '0'
      }, '0')
    }
    return computed(() => tokenEnums[symbol].value.priceUSD)
  }
  return {
    tokenEnums,
    getTokenPair,
    getTokenBuyOrSellPair,
    getTokenIcon,
    getTokenBalance,
    /** @deprecated use getTokenPrice instead */
    getTokenUSD,
    getTokenPrice,
  }
}
