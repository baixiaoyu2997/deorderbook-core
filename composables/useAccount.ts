/**
 * 获取用户地址信息，包括对其身份进行判断,如果只是获取当前用户address，可用此函数代替useWallet
 */
export const useAccount = () => {
  const { address, accounts } = toRefs(useWalletStore())

  const isOwner = computed(() => {
    return address.value === accounts.value.owner.toLowerCase()
  })
  const isCollector = computed(() => {
    return address.value === accounts.value.collector.toLowerCase()
  })
  const isOTCOwner = computed(() => {
    return address.value === accounts.value.otcOwner.toLowerCase()
  })
  const isWorker = computed(() => {
    return address.value === accounts.value.worker.toLowerCase()
  })

  return {
    address,
    isOwner,
    isCollector,
    isOTCOwner,
    isWorker,
    accounts,
  }
}
