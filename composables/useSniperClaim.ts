import { ElLoading } from 'element-plus'
import { redeemRewards } from 'deorderbook-sdk/ethereum/staking_pool'

export const useSniperClaim = () => {
  const claimDialogShow = ref(false)
  const sniperId = ref('')
  const openSniperClaim = (id: string) => {
    sniperId.value = id
    claimDialogShow.value = true
  }
  function claim(id = sniperId.value) {
    const loadingInstance = ref(null)
    loadingInstance.value = ElLoading.service()
    redeemRewards(id)
      .then((resp) => {
        const { waitTx } = useWaitTx(resp)
        waitTx()
          .then((result) => {
            if (result.status === 1) {
              sniperId.value = ''
              const { actionRefreshOptionAccounts } = toRefs(
                useOptionAccountsStore()
              )
              actionRefreshOptionAccounts.value(true)
              useNotify()
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
              })
            }
          })
          .finally(() => {
            loadingInstance.value.close()
          })
      })
      .catch((err) => {
        if (err.code !== 'ACTION_REJECTED') {
          useNotify({
            type: 'error',
            message: err.message,
          })
        }
        loadingInstance.value.close()
      })
  }

  return {
    claim,
    claimDialogShow,
    openSniperClaim,
  }
}
