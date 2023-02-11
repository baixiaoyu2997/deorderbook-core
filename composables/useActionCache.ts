import { UseAsyncStateOptions } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'

export interface UseActionCacheOptions {
  /** 接口缓存时长,默认15000 */
  interval: number
}
export interface CacheMapItem<Data> {
  timestamp: number
  value:
    | {
        state: Data
        isReady: Ref<boolean>
        isLoading: Ref<boolean>
        error: Ref<unknown>
        refresh: () => Promise<Data>
      }
    | undefined
}

// TODO: Type 优化

/**
 * @description 缓存store中接口调用的数据, 不同参数的接口调用会被单独缓存。通过fetchState返回Computed值
 * @export
 * @param {(...args: any[]) => Promise<any>} cb 接口callback
 * @param {*} initialState 初始值
 * @param {*} [options={} as UseActionCacheOptions] extends from useAsyncState
 * @return {*}
 */
export default function useActionCache<Data>(
  cb: (...args: any[]) => Promise<Data>,
  initialState: any,
  options = {} as UseActionCacheOptions
) {
  const cacheMap = reactive(new Map<string, CacheMapItem<Data>>())

  // [ Options ]
  const { interval = 15000, ...useAsyncStateOptions } = options
  const defaultUseAsyncStateOptions = {
    onError: (e: unknown) => {
      console.error(e)
    },
  }

  /**
   * @description 调用接口，返回已缓存的UseAsyncStateReturn类型的数据，如果调用间隔大于interval则重新获取，使用返回值中的refresh可以强制刷新数据
   * @param {unknown[]} [args] 接口参数
   * @return {*} 返回值类型参考CacheMapItem，包括state，isReady，isLoading，error，refresh
   */
  const fetchState = (...args: unknown[]) => {
    const state = cacheMap.get(generateKey(args))

    if (state !== undefined && Date.now() < state.timestamp + interval) {
      // 返回缓存值
      return computed(() => state.value!)
    }
    // 调用接口
    return setState(
      args,
      useAsyncState(() => cb(...args), initialState, {
        ...defaultUseAsyncStateOptions,
        ...useAsyncStateOptions,
      })
    )
  }

  /**
   * @description 通过args作为key获取缓存中的数据
   * @param {unknown[]} [args] 传递给接口的参数
   * @notice 未调用fetchState时，返回Computed<undefined>
   */
  const getState = (...args: unknown[]) => {
    const key = generateKey(args)
    // if (cacheMap.has(key)) {
    return computed(() => cacheMap.get(key)?.value)
    // }
    // else {
    //   // 设置初始值
    //   return setState(params, initialState, 0)
    // }
  }

  /**
   * @description 通过params作为key，设置接口返回的值
   * @param {(unknown[] | undefined)} params 接口参数
   * @param {unknown} value 接口返回值
   * @param {number} [timestamp=Date.now()] 接口调用时间戳，用做与interval进行对比来控制是否需要重新获取
   * @return {*} 返回缓存值
   */
  const setState = (
    params: unknown[] | undefined,
    value: any,
    timestamp: number = Date.now()
  ) => {
    const { state, isReady, isLoading, error, execute } = value
    cacheMap.set(generateKey(params), {
      timestamp,
      value: {
        state,
        isReady,
        isLoading,
        error,
        // refresh会重新调用接口，并更新缓存timestamp
        refresh: () =>
          execute().then((res: any) => {
            setTimeout(() => {
              const state = getState(...(params || []))

              cacheMap.set(generateKey(params), {
                timestamp: Date.now(),
                value: state.value as NonNullable<typeof state.value>,
              })
            })
            return res
          }),
      },
    })
    const newState = getState(...(params || []))
    return newState as ComputedRef<NonNullable<typeof newState.value>>
  }

  /**
   * @description 刷新cacheMap所有数据
   */
  function refreshAllState() {
    cacheMap.forEach((state) => {
      state.value?.refresh?.()
    })
  }

  /**
   * @description 通过params生成Map key
   * @param {unknown[]} [params] 接口参数，可选
   * @return { string } key
   */
  const generateKey = (params?: unknown[]) => {
    return 'key_' + JSON.stringify(params)
  }

  return {
    cacheMap,
    fetchState,
    getState,
    refreshAllState,
  }
}
