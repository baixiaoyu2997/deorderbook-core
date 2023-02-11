export function useNFT() {
  const { nfts, nftCount, formatNFTs } = toRefs(useNFTStore())

  return {
    nfts,
    nftCount,
    formatNFTs,
  }
}
