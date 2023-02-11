import { totalSupply as apiTotalSupply } from 'deorderbook-sdk/ethereum/sniper'
import { balanceOf } from 'deorderbook-sdk/ethereum/hodl'
import { exitAll as optionExit } from 'deorderbook-sdk/ethereum/option'
import { Big } from 'big.js'
import type { Ref } from 'vue'

/**
 * sniper的collect操作相关
 * @param {*} { exerciseTimestamp, sniper, address } address是option的地址
 */
export const useSniperCollect = ({ exerciseTimestamp, sniper, address }) => {
  const { queryAndApprove, isSetOption } = useWallet()
  const { actionRefreshOptionAccounts } = toRefs(useOptionAccountsStore())
  const loading = useLoading()

  const commonOption = {
    default: () => '0',
    server: false,
  }
  const { data: matchingSniperAmount, refresh: totalSniperRefresh } =
    useLazyAsyncData(
      'matchingSniperAmount' + sniper + isSetOption.value,
      () => apiTotalSupply(sniper),
      commonOption
    )
  const { data: bHODLBalance, refresh: bHODLBalanceRefresh } = useLazyAsyncData(
    'bHODLBalance' + address + isSetOption.value,
    () => balanceOf('bHODL', address),
    commonOption
  )
  const { data: uHODLBalance, refresh: uHODLBalanceRefresh } = useLazyAsyncData(
    'uHODLBalance' + address + +isSetOption.value,
    () => balanceOf('uHODL', address),
    commonOption
  )

  const disable = computed(() => {
    return Number(exerciseTimestamp + '000') + 24 * 60 * 60 * 1000 >= Date.now()
  })

  const getToHODLData = () => {
    totalSniperRefresh()
    bHODLBalanceRefresh()
    uHODLBalanceRefresh()
  }

  const approveCollect = async () => {
    try {
      await queryAndApprove({
        from: sniper,
        to: address,
        contracts: 'sniperContracts',
      })
    } catch (error) {
      loading.hide()
      return
    }
    if (Number(bHODLBalance.value) !== 0) {
      try {
        await queryAndApprove({
          from: 'bHODL',
          to: sniper,
          contracts: 'sniperContracts',
        })
      } catch (error) {
        loading.hide()
        return
      }
    }
    if (Number(uHODLBalance.value) !== 0) {
      try {
        await queryAndApprove({
          from: 'uHODL',
          to: sniper,
          contracts: 'sniperContracts',
        })
      } catch (error) {
        loading.hide()
      }
    }
  }
  /** collect取出所有hodl,不支持部分collect */
  const doCollect = async () => {
    const loading = useLoading()
    await approveCollect()
    return optionExit(address)
      .then((resp) => {
        const { waitTx } = useWaitTx(resp)
        return waitTx()
          .then((result) => {
            if (result.status === 1) {
              useNotify()
              actionRefreshOptionAccounts.value(true)
            } else {
              useNotify({
                type: 'error',
              })
            }
          })
          .catch((err) => {
            useNotify({
              type: 'error',
              message: err.message,
            })
          })
          .finally(() => {
            loading.hide()
          })
      })
      .catch((err) => {
        if (err.code !== 'ACTION_REJECTED') {
          useNotify({
            type: 'error',
            message: err.message,
          })
        }
        loading.hide()
      })
  }
  const { redeemFeeRatio } = useOptionFee(address)

  /**
   * @description 获取可能获取的hodl
   * 计算公式：
   * bHODL = sniper数量 * 当前option的bHODL余额 / sniper的总数 - fee;
   * uHODL = sniper数量 * 当前option的uHODL余额 / sniper的总数 - fee;
   * fee=  bHODL或者uHODL * redeemFeeRatio
   * @param {(Ref<string> | string)} sniperAmount 需要除以精度
   */
  function calcGetHODL(sniperAmount: Ref<string> | string) {
    return computed(() => {
      const bHODLAmount = Big(
        matchingSniperAmount.value === '0'
          ? '0'
          : Big(unref(sniperAmount) || '0')
              .times(bHODLBalance.value || '0')
              .div(matchingSniperAmount.value || '0')
      )
      const uHODLAmount = Big(
        matchingSniperAmount.value === '0'
          ? '0'
          : Big(unref(sniperAmount) || '0')
              .times(uHODLBalance.value || '0')
              .div(matchingSniperAmount.value || '0')
      )
      const bHODL = bHODLAmount
        .minus(bHODLAmount.times(redeemFeeRatio.value.state || '0'))
        .toFixed()
      const uHODL = uHODLAmount
        .minus(uHODLAmount.times(redeemFeeRatio.value.state || '0'))
        .toFixed()

      return {
        hasHODLReward: bHODL !== '0' || uHODL !== '0',
        bHODL,
        uHODL,
      }
    })
  }
  return {
    disable,
    approveCollect,
    doCollect,
    calcGetHODL,
    collectFee: redeemFeeRatio,
  }
}
