import { ElMessage } from 'element-plus'

export const useLayout = () => {
  const { setIsLogged, user } = toRefs(useAppStore())
  const { checkCurrentChain } = useWalletStore()
  const { connectWallet } = useWallet()

  onBeforeMount(() => {
    checkCurrentChain()
    setIsLogged.value(
      localStorage.getItem('isLogged'),
      localStorage.getItem('walletType') ?? ''
    )
    if (user.value.isLogged) {
      connectWallet(user.value.walletType).catch((err) => {
        ElMessage.error(err.message)
      })
    }
  })
}
