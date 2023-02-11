import { useLazyAsyncData } from '#imports'

/**
 * @description 与useLazyAsyncData参数一致，添加getData返回。用于store获取数据，支持获取数据时使用缓存(每个组件都应该手动声明数据的请求)
 * @param {...Parameters<typeof useLazyAsyncData>} options
 */
export function useStoreAsyncData(
  ...options: Parameters<typeof useLazyAsyncData>
) {
  const _options = [...options]

  /** 设置useLazyAsyncData默认参数 */
  _options[2] = Object.assign(
    {
      server: false, // 服务端获取
      immediate: false, // 立即执行数据获取
    },
    _options[2]
  )

  const useLazyAsyncDataResult = useLazyAsyncData(
    ...(_options as Parameters<typeof useLazyAsyncData>)
  )

  const isInit = ref(false)
  /** 如果已经获取过数据则只返回一个useLazyAsync实例，除非手动指定refresh */
  const getData = async ({ refresh } = { refresh: false }) => {
    if (!isInit.value || refresh) {
      isInit.value = true
      return await useLazyAsyncDataResult.execute()
    }
    return await Promise.resolve()
  }

  return {
    isInit,
    ...useLazyAsyncDataResult,
    getData,
  }
}
