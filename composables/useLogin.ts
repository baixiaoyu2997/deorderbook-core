export const useLogin = (walletType: 'metamask' = 'metamask') => {
  const { connectWallet } = useWallet()
  const { show, hide } = useLoading()
  show()
  return connectWallet(walletType)
    .catch((err) => {
      useNotify({
        type: 'error',
        message: err.message,
      })
    })
    .finally(() => {
      hide()
    })
}
