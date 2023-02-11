import Big from 'big.js'
import dayjs from 'dayjs'

/**
 * @description 格式化sniper和bullet名称
 * @param {*} {
 *   optionType,
 *   token,
 *   exerciseTimestamp,
 *   strikePrice,
 * }
 * @return {*}
 */
export const useOptionName = ({
  optionType,
  token,
  exerciseTimestamp,
  strikePrice,
}) => {
  const type = String(optionType) === '0' ? 'b' : 'u'
  const newExerciseTimestamp =
    exerciseTimestamp.length <= 10
      ? exerciseTimestamp + '000'
      : exerciseTimestamp
  const time = dayjs(new Date(Number(newExerciseTimestamp))).format('DDMMMYYYY')
  const price = Big(strikePrice || 0)
    .div(Big(10).pow(18))
    .round()
    .toFixed()

  return `${type}${token}_${time}_${price}`
}
