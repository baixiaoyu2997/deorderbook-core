export interface UseCodeSourceOptions {
  /** 堆栈数，通过error信息的第x个堆栈给出代码位置，默认为1 */
  stackAt?: number
}
/**
 * @description 定位代码位置，只应该用于调试
 * @export
 * @return {*}
 */
export function useCodeSource(options: UseCodeSourceOptions = {}) {
  const { stackAt = 1 } = options
  const codeSource = reactive({
    /** 完整的error日志 */
    stack: '',
    /** 源码位置，可以直接点击跳转 */
    link: '',
    // /** 该action由什么函数触发 */
    // trigger: '',
  })
  try {
    throw new Error(' ')
  } catch (error: any) {
    // codeSource.link = `"${eventInfo.match(/\((.+?)\)/)?.[1]}"`.toString()
    // codeSource.trigger = eventInfo.split(' (')[0].trim()
    const config = useRuntimeConfig()
    codeSource.stack = error.stack
    const eventInfo = codeSource.stack.split('at')[stackAt].trim()
    codeSource.link = `"${eventInfo.replace('/_nuxt', config.public.dirname)}"`
  }
  return codeSource
}
