import { getBestOffer } from 'deorderbook-sdk/ethereum/market_bullet'
import { getMarketBulletList } from 'deorderbook-sdk'
import Big from 'big.js'
export function useBulletMarket() {
  const marketBullets = computedAsync(async () => {
    return await getMarketBulletList().then((res) => {
      return res.map((x) => {
        return {
          ...x,
          sellPrice: Big(x.totalSellValue || 0)
            .div(x.sellAmount)
            .toFixed(),
        }
      })
    })
  }, [])
  const { tokenEnums } = useTokens()
  const marketBulletsWithBestOffer = computedAsync(async () => {
    const pList = [] as Promise<any>[]
    marketBullets.value.forEach((x) => {
      const result = getBestOffer(x.bullet, tokenEnums.uHODL.address).then(
        (resId) => {
          const bestOffer = marketBullets.value.find(
            (item) => Number(item.markerBulletId) === Number(resId)
          )

          return {
            ...x,
            recommend: bestOffer
              ? Big(bestOffer?.totalSellValue || 0)
                  .div(bestOffer?.sellAmount)
                  .toFixed()
              : '0',
          }
        }
      )
      pList.push(result)
    })

    return await Promise.all(pList)
  }, [])

  return {
    marketBullets,
    marketBulletsWithBestOffer,
  }
}
