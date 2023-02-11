import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
interface SniperNicknameItem {
  optionType: '0' | '1'
  exerciseTimestamp: string
  /** 行权价格，保留精度 */
  strikePrice: string
}
/**
 * @description 根据所有sniper数据和当前sniper数据计算出它的nickname
 */
export const useSniperNickname = (item: SniperNicknameItem) => {
  if (Object.keys(item).length === 0) return
  const { options: list } = useOptions()
  let timeName = ''
  let priceName = ''
  const typeName = item.optionType === '1' ? 'Bull' : 'Bear'
  const exerciseTime = dayjs.unix(
    item.exerciseTimestamp.length !== dayjs().valueOf().toString().length
      ? Number(item.exerciseTimestamp)
      : Number(item.exerciseTimestamp) / 1000
  )
  const startDateOfMonth = exerciseTime.startOf('month')
  const endDateOfMonth = startDateOfMonth.add(1, 'month')
  let fridayNumber = 0
  let itemWeekNumber = 0
  for (
    let day = startDateOfMonth;
    day.isBefore(endDateOfMonth);
    day = day.add(1, 'day')
  ) {
    if (day.date() === exerciseTime.date()) {
      itemWeekNumber = fridayNumber
    }
    if (day.day() === 5) {
      fridayNumber++
    }
  }
  if (itemWeekNumber === 0) {
    timeName = 'Alpha'
  } else if (itemWeekNumber === 1) {
    timeName = 'Beta'
  } else if (itemWeekNumber === 2) {
    timeName = 'Delta'
  } else if (itemWeekNumber === 3) {
    timeName = 'Gamma'
  } else {
    timeName = 'Omega'
  }
  const targetList = list.value
    .filter(
      (x) =>
        x.optionType === item.optionType &&
        x.exerciseTimestamp === item.exerciseTimestamp
    )
    .sort((x, y) => Number(x.strikePrice) - Number(y.strikePrice))
  const priceIndex = targetList.findIndex(
    (i) => i.strikePrice === item.strikePrice
  )
  if (priceIndex < targetList.length - 1 && priceIndex > 0) {
    priceName = 'Grand'
  } else {
    priceName = priceIndex === 0 ? 'Deluxe' : 'Supreme'
  }
  return `${timeName} ${priceName} ${typeName}`
}
