/**
 * @description 保证只会执行一次的computed,防止computed中使用useLazyAsyncData会触发两次的问题
 * @param {*} cb 与computed参数相同，回调函数
 */
export function computedOnce(cb) {
  return computedWithControl(() => false, cb)
}
