const refsMap = new Map()

/**
 * @description 为当前组件注册初始化函数，可以通过为该组件添加ref在其他组件中调用
 * @param {(object) => any} [selfInit] 注册当前组件的初始化函数,支持接收一个对象的参数
 */
export const useRefsInit = <T extends { [index: string]: any }>(
  selfInit?: (options?: T) => unknown
) => {
  if (selfInit) {
    const { proxy } = getCurrentInstance()
    refsMap.set(proxy, selfInit)
    onUnmounted(() => {
      refsMap.delete(proxy)
    })
  }

  /**
   * @description 通过ref或者ref数组调用已注册组件的初始化函数
   */
  const refsInit = (
    refsName: string | ({ ref: string; options?: object } | string)[]
  ) => {
    const formatRefList = typeof refsName === 'string' ? [refsName] : refsName
    const refList = formatRefList.map((item) => {
      return {
        ref: typeof item === 'string' ? item : item?.ref,
        options: typeof item === 'string' ? undefined : item?.options,
      }
    })
    refList.forEach((item) => {
      refsMap.forEach((callback, key) => {
        if (key?.$?.vnode?.ref?.r === item.ref) {
          callback(item?.options)
        }
      })
    })
  }

  return {
    selfInit,
    refsInit,
  }
}
