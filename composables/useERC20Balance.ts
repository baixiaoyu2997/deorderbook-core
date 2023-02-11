import { balanceOf } from 'deorderbook-sdk/ethereum/token_erc20'

/**
 * @description 获取ERC20 Token余额
 * @param {string} address token地址
 */
export function useERC20Balance(address: string) {
  const { address: selfAddress } = useWallet()
  const balance = ref('0')
  const isLoading = ref(false)
  watch(
    selfAddress,
    () => {
      if (selfAddress.value) {
        isLoading.value = true
        balanceOf(unref(address), unref(selfAddress))
          .then((res) => {
            balance.value = res.toString()
          })
          .finally(() => {
            isLoading.value = false
          })
      }
    },
    {
      immediate: true,
    }
  )

  return {
    balance,
    isLoading,
  }
}
