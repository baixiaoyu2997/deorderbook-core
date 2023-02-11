import { ContractTransaction } from 'ethers'

/**
 * @description  等待链上交易完成,保存交易hash或者approve hash
 * @param { string } hash 交易hash
 */
export const useWaitTx = (
  tx: ContractTransaction,
  type: 'tx' | 'approve' = 'tx'
) => {
  const { txHash, approveHash, setBalance } = toRefs(useWalletStore())
  const isTxPending = computed(() => {
    return txHash.value !== null
  })
  const isApprovePending = computed(() => {
    return approveHash.value !== null
  })
  const waitTx = () => {
    const hashRef = type === 'tx' ? txHash : approveHash
    hashRef.value = tx.hash

    return tx.wait().then((resp) => {
      hashRef.value = null
      if (type === 'tx') {
        setBalance.value()
      }
      return resp
    })
  }
  return {
    waitTx,
    isTxPending,
    isApprovePending,
  }
}
