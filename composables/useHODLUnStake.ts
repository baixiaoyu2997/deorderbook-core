import { Big } from 'big.js'
import { unstake as hodlPoolUnstake } from 'deorderbook-sdk/ethereum/hodl_pool'

export const useHODLUnStake = (cb?: (symbol: 'bHODL' | 'uHODL') => unknown) => {
  const loading = useLoading()

  const { userUHODL, userBHODL, actionRefreshHODLPools } = toRefs(
    useHODLStore()
  )
  const unStakeVisible = ref(false)

  const unStake = (symbol: 'bHODL' | 'uHODL', amount: string) => {
    loading.show()
    const hodlAmount = amount
    const hodlSymbol = symbol
    const poolId =
      hodlSymbol === 'bHODL' ? userBHODL.value.poolId : userUHODL.value.poolId

    return hodlPoolUnstake(poolId, hodlAmount)
      .then((resp) => {
        const { waitTx } = useWaitTx(resp)
        return waitTx()
          .then((result) => {
            if (result.status === 1) {
              useNotify()
              unStakeVisible.value = false
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
      })
      .finally(() => {
        loading.hide()
      })
  }

  const formatDecimals = (val: string) => {
    const newVal = val === '' || val === undefined ? 0 : val
    const x = Big(10).pow(18)
    const y = Big(newVal).div(x).toFixed()
    return y
  }
  return {
    unStakeVisible,
    unStake,
  }
}
