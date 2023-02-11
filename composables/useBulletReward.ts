import { Big } from 'big.js'
import { getTransactionList } from 'deorderbook-sdk'
import { balanceOf } from 'deorderbook-sdk/ethereum/bullet'
import {
  drawReward,
  stakingInfo,
} from 'deorderbook-sdk/ethereum/dob_staking_pool'
import { ComputedRef } from 'vue'
import { div18 } from '~/utils'

/**
 * 获取今日预计dob发放bullet奖励
 */
function useBulletRewardBase() {
  // const startTime = dayjs().startOf('day').unix()
  // const endTime = dayjs().endOf('day').unix()
  // const originData = computedAsync(async () => {
  //   return await getBulletReward({ startTime, endTime })
  // }, [])
  const { bullets: allBullets } = toRefs(useBulletsStore())

  const loading = useLoading()

  /**  行权期没有结束的bullets */
  const filterDateBullets = computed(() => {
    if (allBullets.value === null) return []
    return allBullets.value.filter(
      (item) =>
        Date.now() <
        Number(item.exerciseTimestamp + '000') + 24 * 60 * 60 * 1000
    )
  })
  const {
    dobContractInfo,
    userInfo,
    isCheckNFT,
    lastWorkTimestamp,
    actionRefreshUserDOBInfo,
  } = toRefs(useDOBStore())

  /**  当前周期所有用户总共质押的dob数量 */
  const totalDailyLockDOB = computed(
    () => dobContractInfo.value.totalDailyLockDOB
  )
  /**  当前周期该用户质押的dob */
  const todayUserStaking = computed(() => userInfo.value.dailyStakingAmount)

  const { accounts, address } = useAccount()
  const { getTokenPrice } = useTokens()

  const { getOptionBy } = useOptions()
  /** 获取当前周期所有deorder交易记录 */
  const deorderTrades = computedAsync(async () => {
    return await getTransactionList({
      where: {
        action_starts_with: 'DeOrder',
        timestamp_gt: lastWorkTimestamp.value,
      },
    })
  }, [])

  /** 获取当前周期所有deorder交易的feeRatio */
  const optionFees = computed(() => {
    return deorderTrades.value.map((res) => {
      const option = getOptionBy({
        exerciseTimestamp: res.exerciseTimestamp!,
        strikePrice: res.strikePrice!,
      })
      if (option.value?.address === undefined) return undefined
      const { bulletToRewardRatio } = useOptionFee(option.value!.address)
      return bulletToRewardRatio.value.state
    })
  })

  /** 获取当前周期所有option的bullet数量 */
  const optionsBullet = computed(() => {
    const list = [] as { bullet: string; amount: string }[]
    deorderTrades.value.forEach((res, i) => {
      const option = getOptionBy({
        exerciseTimestamp: res.exerciseTimestamp!,
        strikePrice: res.strikePrice!,
      })
      if (option.value?.address === undefined) return undefined
      const bulletToRewardRatio = optionFees.value[i]
      const bulletAmount = Big(bulletToRewardRatio || 0)
        .times(100)
        .times(res.inTokenAmount!)
        .toFixed()
      const existBulletIndex = list.findIndex(
        (x) => x.bullet === option.value!.bullet
      )
      // 如果有相同的bullet，则累加bullet amount
      if (existBulletIndex !== -1) {
        list[existBulletIndex].amount = Big(list[existBulletIndex].amount)
          .plus(bulletAmount)
          .toFixed()
      } else {
        list.push({
          bullet: option.value!.bullet,
          amount: bulletAmount,
        })
      }
    })
    return list
  })

  /** 计算可能获得的当天bullet奖励 */
  const expectedRewardBullets = computed(() => {
    return filterDateBullets.value.map((x) => {
      // console.log(optionsBullet.value.find((y) => y.bullet === x.id))
      const totalBalance =
        optionsBullet.value.find((y) => y?.bullet === x.id)?.amount || '0'

      const myBullet =
        totalDailyLockDOB.value === '0'
          ? '0'
          : Big(todayUserStaking.value.toString())
              .div(totalDailyLockDOB.value.toString())
              .times(totalBalance)
              .toFixed()

      // console.log(myBullet)
      return {
        ...x,
        totalBalance,
        myBullet,
      }
    })
  })

  // 所有bullet美元价格，用于bulletsTotalUSD和myTotalUSD响应式更新
  const bulletUSDList = computed(() => {
    const list = []
    for (const x of expectedRewardBullets.value) {
      const token = String(x.optionType) === '1' ? 'bBULLET' : 'uBULLET'
      const bulletUSD = getTokenPrice(token, {
        exerciseTimestamp: x.exerciseTimestamp,
        strikePrice: Big(x.strikePrice)
          .div(10 ** 18)
          .toFixed(),
        address: x.id,
      })
      list.push(bulletUSD)
    }
    return list
  })

  /** 今日所有发放bullet美元价值 */
  const bulletsTotalUSD = computed(() => {
    return expectedRewardBullets.value
      .reduce((sum, current, i: number) => {
        return sum.plus(
          Big(div18(current.totalBalance.toString() || '0')).times(
            bulletUSDList.value[i].value || '0'
          )
        )
      }, Big(0))
      .toFixed()
  })
  /** 今日当前用户可能获取的bullet美元价值 */
  const myTotalUSD = computed(() => {
    return (expectedRewardBullets.value as any)
      .reduce(
        (
          sum: Big,
          current: (typeof expectedRewardBullets.value)[number],
          i: number
        ) => {
          return sum.plus(
            Big(div18(current.myBullet || '0')).times(
              bulletUSDList.value[i].value || '0'
            )
          )
        },
        Big(0)
      )
      .toFixed()
  })
  /** 领取质押dob的每日bullet奖励
   * @notice 合约支持NFt的时候传入单个id，不支持时,传入0可以一键领取全部
   */
  const drawBulletReward = (_address: string, tokenId = 0) => {
    loading.show()
    const addr = _address || address.value
    return drawReward(addr, tokenId)
      .then((tx) => {
        const { waitTx } = useWaitTx(tx)
        return waitTx().then((result) => {
          if (result.status === 1) {
            useNotify()
            actionRefreshItems.value()
            actionRefreshUserDOBInfo.value()
          } else {
            useNotify({
              type: 'error',
            })
          }
        })
      })
      .catch((error) => {
        if (error.code !== 'ACTION_REJECTED') {
          useNotify({
            type: 'error',
            message: error.message,
          })
        }
      })
      .finally(() => {
        loading.hide()
      })
  }

  const {
    lastDeliverStartBlock,
    lastDeliverEndBlock,
    actionRefreshItems,
    userClaimBlock,
  } = toRefs(useDOBRewardStore())

  // 用户是否可以领取上个周期的奖励,参考：https://github.com/ncying/DeOrderbook/blob/b00067706c64876fd06e376a43f2c6ce141e8812/contracts/staking/DOBStakingPool.sol#L414
  const isRewardClaimable = computed(() => {
    // 用户是否已经领取了上个周期的奖励
    if (Number(userClaimBlock.value) > Number(lastDeliverEndBlock.value))
      return false

    let shareAmount = '0'
    if (
      Number(userInfo.value.currentStakingAmount) >=
        Number(dobContractInfo.value.bulletRewardThreshold) &&
      Number(userInfo.value.stakingAmountUpdateBlockHeight) >
        Number(lastDeliverStartBlock.value) &&
      Number(userInfo.value.stakingAmountUpdateBlockHeight) <=
        Number(lastDeliverEndBlock.value)
    ) {
      shareAmount = userInfo.value.currentStakingAmount.toString()
    }
    if (
      Number(userInfo.value.claimStakingAmount) >=
        Number(dobContractInfo.value.bulletRewardThreshold) &&
      Number(userInfo.value.claimAmountUpdateBlockHeight) >
        Number(lastDeliverStartBlock.value) &&
      Number(userInfo.value.claimAmountUpdateBlockHeight) <=
        Number(lastDeliverEndBlock.value)
    ) {
      shareAmount = userInfo.value.claimStakingAmount.toString()
    }

    return Number(shareAmount) > 0
  })

  return {
    // originData,
    myTotalUSD,
    bulletUSDList,
    bulletsTotalUSD,
    drawBulletReward,
    expectedRewardBullets,
    isRewardClaimable,
  }
}

export const useBulletReward = createSharedComposable(useBulletRewardBase)
