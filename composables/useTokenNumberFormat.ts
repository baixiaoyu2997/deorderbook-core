import { Big } from 'big.js'
import type { TokenSymbols } from './useTokens'
import { numberFormat, NumberFormatOptions } from '~/utils'
export interface TokenNumberFormatOptions extends NumberFormatOptions {
  /** 根据传入的token和twoDecimalTokens来确认是否需要限制小数位数 */
  token: TokenSymbols | 'SNIPER' | 'BULLET'
}
const twoDecimalTokens = ['USDC', 'uHODL', 'DOB']
/**
 * @description 对于特定token的数量，最多2位小数，其他token按照numberFormat默认格式化
 * @export
 * @param {(number | string | Big)} num
 * @param {TokenNumberFormatOptions} [options={}]
 */
export default function useTokenNumberFormat(
  num: number | string | Big,
  options: TokenNumberFormatOptions
) {
  const { token, ...numberFormatOption } = options
  let _numberFormatOption = numberFormatOption

  const dp = numberFormatOption.dp
  let minNumber = Big(1).div(10 ** (dp || 8))
  let isMinNumber = Big(num || 0).lt(minNumber) && !Big(num || 0).eq(0)

  if (twoDecimalTokens.includes(token)) {
    minNumber = Big(1).div(10 ** (dp || 2))
    isMinNumber = Big(num || 0).lt(minNumber) && !Big(num || 0).eq(0)

    _numberFormatOption = {
      ...numberFormatOption,
      dp: 2,
    }
  }

  return isMinNumber
    ? '<' + minNumber.toFixed()
    : numberFormat(num, 'en-US', _numberFormatOption)
}
