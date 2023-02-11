import { redeemRewards } from 'deorderbook-sdk/ethereum/hodl_pool'
import { useWaitTx } from '~/composables/useWaitTx'

export interface ClaimOptions {
  symbol: 'bHODL' | 'uHODL'
}

export const useHODLClaim = (claimOptions?: ClaimOptions) => {
  const loading = useLoading()

  const { userUHODL, userBHODL, actionRefreshHODLPools } = toRefs(
    useHODLStore()
  )

  const hodlSymbol = ref(claimOptions?.symbol as 'bHODL' | 'uHODL') // 如果不使用弹窗，那么应该在doClaim函数传递id
  const getHODL = (symbol: 'bHODL' | 'uHODL') => {
    return symbol === 'bHODL' ? userBHODL : userUHODL
  }
  const currentHODL = computed(() => {
    return getHODL(hodlSymbol.value).value
  })

  const doClaim = (options?: ClaimOptions) => {
    loading.show()

    const hodl = options?.symbol ? getHODL(options.symbol) : currentHODL

    return redeemRewards(hodl.value.poolId)
      .then(async (resp) => {
        const { waitTx } = useWaitTx(resp)
        await waitTx()
          .then((result) => {
            if (result.status === 1) {
              actionRefreshHODLPools.value(true)
              useNotify()
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
    currentHODL,
    doClaim,
  }
}
