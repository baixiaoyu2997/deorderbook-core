import { defaultProvider } from '~/utils/get-rpc-host'

/**
 * @description 通过用户地址反向查询ens注册的name
 */
export function useENS(address?: string) {
  const _address = computed(() => {
    return address || useAccount().address.value
  })

  const { data: ensName, refresh } = useLazyAsyncData(
    'useENS' + _address.value,
    () => {
      return defaultProvider.lookupAddress(_address.value)
    },
    {
      server: false,
      immediate: false,
    }
  )
  watch(
    _address,
    (v) => {
      if (v) {
        refresh()
      }
    },
    {
      immediate: true,
    }
  )
  return {
    ensName,
  }
}
