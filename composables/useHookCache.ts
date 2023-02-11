/**
 * @description 全局缓存hook初始化操作，所有同名hook只执行一次,不要在此函数中注册全局事件,返回promise时,cache为useLazyAsyncData返回值
 * @param { string } id 唯一值，使用被缓存hook函数名
 * @param { function } [callback] 初始化函数
 * @returns { {cache: ref|reactive,patchCache:function,clearCache:function} } { object:callback返回值会自动包裹在ref或者reactive中,不要修改cache，只应从patchCache修改, patchCache:更改cache函数, clearCache:清除cache函数 }
 */
export function useHookCache(id: string, callback) {
  const store = useHookStore()
  if (!(id in store.hookState)) {
    const initValue = callback?.()
    if (initValue?.constructor === Promise) {
      store.hookState[id] = useLazyAsyncData(id, () => initValue)
    } else if (initValue?.constructor === Object) {
      store.hookState[id] = reactive(initValue)
    } else {
      store.hookState[id] = ref(initValue)
    }
  }
  const hookState =
    store.hookState[id].constructor === Promise
      ? store.hookState[id]
      : toRef(store.hookState as any, id)
  const clearCache = () => {
    delete store.hookState[id]
  }
  const patchCache = (fn) => {
    const flag = id + fn.toString()
    if (store.hookPatchedSet.has(flag)) return
    store.hookPatchedSet.add(flag)
    return fn(hookState)
  }
  return {
    cache: hookState,
    patchCache,
    clearCache,
  }
}
