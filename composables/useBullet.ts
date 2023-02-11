import { storeToRefs } from 'pinia'
import type { FormattedBullet } from '~/types/options'

enum BulletType {
  ALL = 'ALL',
  BBULLET = 'bBULLET',
  UBULLET = 'uBULLET',
}

export const useBullet = () => {
  const store = useOptionAccountsStore()
  const { formattedUserBullets, loading: isLoading } = storeToRefs(store)
  const bulletType = ref<BulletType>(BulletType.UBULLET)
  const filterExpired = ref(false)
  const beforeExpired = ref(false)

  const bulletData = ref<FormattedBullet[]>([])

  function formatType(
    type: BulletType,
    filterExpired: boolean,
    beforeExpired: boolean
  ) {
    const list = formattedUserBullets.value.sort((x, y) => {
      if (Number(x.exerciseTimestamp) - Number(y.exerciseTimestamp)) {
        return Number(x.exerciseTimestamp) - Number(y.exerciseTimestamp)
      } else {
        return Number(x.strikePrice) - Number(y.strikePrice)
      }
    })
    return list.filter((x) => {
      if (type === BulletType.ALL) {
        if (Number(x.amount) > 0) {
          if (filterExpired) {
            return Date.now() < Number(x.exerciseTimestamp + '000')
          } else if (beforeExpired) {
            return (
              Date.now() <
              Number(x.exerciseTimestamp + '000') + 1000 * 60 * 60 * 24
            )
          }
          return x
        } else {
          return false
        }
      } else if (type === BulletType.BBULLET) {
        if (String(x.optionType) === '0' && Number(x.amount) > 0) {
          if (filterExpired) {
            return Date.now() < Number(x.exerciseTimestamp + '000')
          } else if (beforeExpired) {
            return (
              Date.now() <
              Number(x.exerciseTimestamp + '000') + 1000 * 60 * 60 * 24
            )
          }
          return x
        }
        return false
      } else {
        if (String(x.optionType) === '1' && Number(x.amount) > 0) {
          if (filterExpired) {
            return Date.now() < Number(x.exerciseTimestamp + '000')
          } else if (beforeExpired) {
            return (
              Date.now() <
              Number(x.exerciseTimestamp + '000') + 1000 * 60 * 60 * 24
            )
          }
          return x
        }
        return false
      }
    })
  }

  watch(
    [formattedUserBullets, bulletType, filterExpired, beforeExpired],
    () => {
      bulletData.value = formatType(
        bulletType.value,
        filterExpired.value,
        beforeExpired.value
      )
    },
    {
      immediate: true,
      deep: true,
    }
  )

  return {
    bulletType,
    filterExpired,
    beforeExpired,
    bulletData,
    isLoading,
  }
}
