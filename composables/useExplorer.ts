export function useExplorer(txHash?: string) {
  const explorerURL = ref(`https://goerli.etherscan.io/tx/${txHash}`)
  const goExplorer = (hash?: string) => {
    const _hash = hash || txHash
    const explorerURL = `https://goerli.etherscan.io/tx/${_hash}`
    window.open(explorerURL)
  }
  return {
    explorerURL,
    goExplorer,
  }
}
