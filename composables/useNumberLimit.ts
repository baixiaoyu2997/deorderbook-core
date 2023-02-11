import { Big } from 'big.js'
import type { Ref } from 'vue'

export interface LimitNumberOptions {
  maxLength?: number
  maxDigits?: number
  /** 默认值为8，如果格式化对象为美元代币（USDC and uHODL）或者 DOB或者展示为美元时, 应该指定maxDigitsWithZero为2 */
  maxDigitsWithZero?: number
}
/**
 * 计算小数点后0的长度
 */
const calcDigitsZeroLength = (value: `${number}`) => {
  const digits = value.split('.')[1] || ''
  const digitsWithoutZeroLength = String(Number(digits)).length
  const zeroLength = digits.length - digitsWithoutZeroLength
  return zeroLength
}
/**
 * 限制数字字符串长度，小数点后非0部分最多保留4位有效数字，整个字符串最大长度为12位，参数可以为响应式类型
 * @param {(Ref<string> | string)} num 输入的数字字符串
 * @param {LimitNumberOptions} [options={ maxLength:12, maxDigits:4, maxDigitsWithZero: 8 }]
 * @notice 如果为input组件使用，推荐使用useNumberLimitDebounceFn替代
 */
export function useNumberLimit(
  num: Ref<`${number}`> | `${number}` | string,
  options?: LimitNumberOptions
) {
  const _options = Object.assign(
    {
      maxLength: 12,
      maxDigits:
        options?.maxDigitsWithZero && options?.maxDigitsWithZero < 4
          ? options?.maxDigitsWithZero
          : 4,
      maxDigitsWithZero: 8,
    },
    options
  )
  const { maxLength, maxDigits, maxDigitsWithZero } = toRefs(reactive(_options))

  const value = ref('0' as `${number}`)

  const formatValue = (num: Ref<`${number}`> | `${number}`) => {
    const numString = Big(unref(num || '0'))
      .round(unref(maxDigitsWithZero))
      .toFixed() as `${number}`
    const zeroLength = calcDigitsZeroLength(numString)
    // 根据小数点后0的位数，保留小数长度
    const limitDigitsValue = Big(numString)
      .round(zeroLength + unref(maxDigits))
      .prec(unref(maxLength)) // 限制字符串最多12位
      .toFixed()

    return limitDigitsValue.substring(
      0,
      numString.includes('.') ? unref(maxLength) + 1 : unref(maxLength)
    ) as `${number}`
  }

  watch(
    [() => num, maxDigitsWithZero, maxDigits, maxLength],
    () => {
      value.value = formatValue(num)
    },
    {
      immediate: true,
    }
  )

  return value
}
