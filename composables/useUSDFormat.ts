import { Big } from 'big.js'
import { numberFormat } from '~/utils'
export interface UseUSDFormat {
  /** 自定义格式化数字前缀 */
  prefix?: string
  /** 自定义格式化数字后缀 */
  suffix?: string
  /** 显示约等于符号,默认为false */
  showApprox?: boolean
}
/**
 * @description 用于显示美元时的格式化函数，格式化数字为千分符格式，只显示两位小数，并对最小显示数字进行限制，
 * @export
 * @param {(number | string | Big)} num
 * @param {UseUSDFormat} [options={}]
 * @return {*}
 */
export default function useUSDFormat(
  num: number | string | Big,
  options: UseUSDFormat = {}
) {
  const { suffix = '', showApprox = false } = options
  // 最小显示数字
  const isMinNumber = Big(num || 0).lt('0.01') && !Big(num || 0).eq(0)
  const formatNum = numberFormat(num, 'en-US', {
    dp: 2,
    minimumFractionDigits: 2,
  })
  const prefix =
    options.prefix ?? (isMinNumber ? '<$' : showApprox ? '≈ $' : '$')
  const usdString = isMinNumber
    ? '0.01'
    : formatNum === '0.00'
    ? '0'
    : formatNum

  return `${prefix}${usdString}${suffix}`
}
