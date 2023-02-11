import { stake as hodlPoolStake } from 'deorderbook-sdk/ethereum/hodl_pool'
import { HODLStakingPoolsAddress } from 'deorderbook-sdk'
/**
 * hodl stake 相关逻辑
 */
export const useHODLStake = (cb?: (symbol: 'bHODL' | 'uHODL') => unknown) => {
  const loading = useLoading()

  const { txWithApprove } = useWallet()
  const { userBHODL, userUHODL, actionRefreshHODLPools } = toRefs(
    useHODLStore()
  )

  const stakeVisible = ref(false)

  /**
   * @description hodl stake, v1版本使用时不需要加参数，但是需要先调用openHODLStake,v2带参数就不用调用openHODLStake
   * @param {('bHODL' | 'uHODL')} symbol hodl token type
   * @param {string} amount hodl token amount,带精度的值
   */
  const startStake = (symbol: 'bHODL' | 'uHODL', amount: string) => {
    loading.show()
    const hodlAmount = amount
    const hodlSymbol = symbol

    const hodlData = symbol === 'bHODL' ? userBHODL : userUHODL
    const hodlPoolAddress = HODLStakingPoolsAddress
    const poolId = hodlData.value.poolId
    // 确保等待poolId加载完毕后再stake
    return txWithApprove(hodlSymbol, hodlPoolAddress, () =>
      hodlPoolStake(poolId, hodlAmount)
    )
      .then((result) => {
        if (result.status === 1) {
          useNotify()
          stakeVisible.value = false
          actionRefreshHODLPools.value(true)
          cb?.(hodlSymbol)
        } else {
          useNotify({
            type: 'error',
          })
        }
      })
      .catch((err) => {
        if (err.code !== 'ACTION_REJECTED') {
          useNotify({
            type: 'error',
            message: err.message,
          })
        }
        return Promise.reject(err)
      })
      .finally(() => {
        loading.hide()
      })
  }

  return {
    stakeVisible,
    startStake,
  }
}
