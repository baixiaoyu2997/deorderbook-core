import { Big } from 'big.js'
import { poolData } from 'deorderbook-sdk/ethereum/dob_staking_pool'
import { defaultProvider } from '~/utils/get-rpc-host'
import { useTokensStore } from '~/store/tokens'
import { DOBContractInfo } from '~/types/dob'

/**
 * @description sniper apr需要使用的数据结构
 * @export
 * @interface SniperAPRData
 */
export interface SniperAPRData {
  /** option address */
  address: string
}

export const useApy = () => {
  const { tokenDOB, tokenWBTC, tokenUSDC, tokenUHODL, tokenBHODL } = toRefs(
    useTokensStore()
  )
  const { sniperPools } = toRefs(usePoolsStore())
  const { options } = toRefs(useOptionsStore())
  /**
   * @description 获取sniper的APY百分比原始值，没有%符号
   * @return {*}  {Promise<string>}
   */
  function getDeorderOriginApy(data: SniperAPRData, inputTokenUSD?: string) {
    return computed(() => {
      const sniperPool = sniperPools.value.find(
        (pool) => pool.option === data.address
      )
      const targetOption = options.value.find((option) => {
        return option.address === data.address
      })
      const rewardUSD = Big(sniperPool!.rewardPerBlock)
        .div(tokenDOB.value.denominator)
        .times(24 * 60 * 5 * 365)
        .times(tokenDOB.value.priceUSD)
      const stakedUSD = Big(sniperPool!.stakedAmount)
        .div(
          targetOption!.optionType === '0'
            ? tokenWBTC.value.denominator
            : tokenUSDC.value.denominator
        )
        .times(
          targetOption!.optionType === '0'
            ? tokenWBTC.value.priceUSD
            : tokenUSDC.value.priceUSD
        )
        .add(Big(inputTokenUSD ?? '0'))
      // vAPR set to 100,000 when no staked
      const apr = stakedUSD.eq(0)
        ? Big(1000000)
        : rewardUSD.div(stakedUSD).mul(100)
      return apr.toFixed()
    })
  }

  /**
   * @description 获取sniper的APY百分比值，限制两位小数，带有%符号
   * @return {*}  {Promise<string>}
   */
  function getDeorderApy(data: SniperAPRData, inputTokenUSD?: string) {
    return computed(() => {
      const apyNumber = getDeorderOriginApy(data, inputTokenUSD).value
      return formatPercentage(apyNumber)
    })
  }

  /**
   * 获取dob的APY百分比原始值，没有%符号.
   * 计算公式：(last7RewardUSD + currentRewardUSD) * 52 / totalStakedUSD
   * @return {*}  {Promise<string>}
   */
  async function getLockOriginApy(
    dobInfo: Pick<
      DOBContractInfo,
      'collectorUHODLBalance' | 'collectorBHODLBalance' | 'totalStake'
    >
  ) {
    const blockNumber = await defaultProvider.getBlockNumber()
    return Promise.all([
      poolData().catch(() => {
        return {
          uHODLAccuReward: '0',
          bHODLAccuReward: '0',
        }
      }),
      poolData(blockNumber - 7 * 24 * 60 * 5).catch(() => {
        return {
          uHODLAccuReward: '0',
          bHODLAccuReward: '0',
        }
      }),
    ])
      .then((res) => {
        const [currentData, data7DaysAgo] = res
        const last7USD = Big(currentData.uHODLAccuReward.toString())
          .minus(data7DaysAgo.uHODLAccuReward.toString())
          .div(tokenUHODL.value.denominator)
          .add(
            Big(tokenWBTC.value.priceUSD)
              .mul(
                Big(currentData.bHODLAccuReward.toString()).minus(
                  data7DaysAgo.bHODLAccuReward.toString()
                )
              )
              .div(tokenBHODL.value.denominator)
          )
        const currentRewardUSD = Big(dobInfo.collectorUHODLBalance)
          .div(tokenUHODL.value.denominator)
          .add(
            Big(dobInfo.collectorBHODLBalance)
              .div(tokenBHODL.value.denominator)
              .mul(tokenWBTC.value.priceUSD)
          )
        const result = last7USD
          .add(currentRewardUSD)
          .div(
            Big(dobInfo.totalStake)
              .div(tokenDOB.value.denominator)
              .mul(tokenDOB.value.priceUSD)
          )
          .mul(52)
          .mul(100)
        return result.toFixed()
      })
      .catch(() => {
        return '0'
      })
  }
  /**
   * @description 获取dob的APY百分比值，有%符号，限制两位小数
   * @return {*}  {Promise<string>}
   */
  async function getLockApy(
    dobInfo: Pick<
      DOBContractInfo,
      'collectorUHODLBalance' | 'collectorBHODLBalance' | 'totalStake'
    >
  ) {
    return formatPercentage(await getLockOriginApy(dobInfo))
  }
  return {
    getDeorderApy,
    getDeorderOriginApy,
    getLockApy,
    getLockOriginApy,
  }
}
