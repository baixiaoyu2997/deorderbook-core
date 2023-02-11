import { storeToRefs } from 'pinia'
import { FormattedOptionAccount } from '~/types/options'

export enum SNIPER_TYPE {
  ALL = 'ALL',
  WALLET = 'Wallet',
  POOL = 'SNIPER Pool',
}
interface FindSniperOptions {
  address: string
}
export const useSniper = () => {
  const store = useOptionAccountsStore()
  const { formattedUserSnipers, loading: isLoading } = storeToRefs(store)
  const sniperType = ref<SNIPER_TYPE>(SNIPER_TYPE.WALLET)
  const isStartExercise = ref(false)
  const isNotStartExercise = ref(false)
  const sniperData = ref<FormattedOptionAccount[]>([])

  function formatType(
    type: SNIPER_TYPE,
    isNotStartExercise: boolean,
    isStartExercise: boolean
  ) {
    return (
      formattedUserSnipers.value?.filter((x) => {
        if (type === SNIPER_TYPE.ALL) {
          if (isStartExercise) {
            return (
              Date.now() > Number(x.exerciseTimestamp) + 1000 * 60 * 60 * 24
            )
          } else if (isNotStartExercise) {
            return Date.now() < Number(x.exerciseTimestamp)
          }
          return x
        } else if (type === SNIPER_TYPE.WALLET) {
          if (Number(x.matchingSniperAmount) > 0) {
            if (isStartExercise) {
              return (
                Date.now() > Number(x.exerciseTimestamp) + 1000 * 60 * 60 * 24
              )
            } else if (isNotStartExercise) {
              return Date.now() < Number(x.exerciseTimestamp)
            }
            return x
          }
          return false
        } else {
          if (Number(x.stakedAmount) > 0) {
            if (isStartExercise) {
              return (
                Date.now() > Number(x.exerciseTimestamp) + 1000 * 60 * 60 * 24
              )
            } else if (isNotStartExercise) {
              return Date.now() < Number(x.exerciseTimestamp)
            }
            return x
          }
          return false
        }
      }) || []
    )
  }

  watch(
    [sniperType, isNotStartExercise, isStartExercise, formattedUserSnipers],
    () => {
      sniperData.value = formatType(
        sniperType.value,
        isNotStartExercise.value,
        isStartExercise.value
      )
    },
    {
      immediate: true,
      deep: true,
    }
  )
  function findSniper(options: FindSniperOptions) {
    const targetSniper = sniperData.value.find((pool) => {
      return pool.address === options.address
    })
    return targetSniper
  }
  return {
    sniperType,
    isStartExercise,
    isNotStartExercise,
    sniperData,
    isLoading,
    findSniper,
  }
}
