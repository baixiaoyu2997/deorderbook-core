import { Big } from 'big.js'
import type { Ref } from 'vue'
import type { LimitNumberOptions } from './useNumberLimit'
export interface LimitNumberDebounceOptions extends LimitNumberOptions {
  /** 延迟格式化，单位毫秒 */
  wait?: number
  // maxWait?: number
}

/**
 * 为input设计的延迟格式化数字方法，使用方法参考useNumberLimit
 * @param {(Ref<string> | string)} num 输入的数字字符串
 * @param {LimitNumberDebounceOptions} [options={ maxLength:12, maxDigits:4, maxDigitsWithZero: 8 ,wait?}]
 */
export function useNumberLimitDebounceFn(options?: LimitNumberDebounceOptions) {
  return useDebounceFn((v, cb: (value: `${number}`) => any) => {
    const limitValue = useNumberLimit(v).value
    cb(limitValue)
  }, options?.wait || 500)
}
