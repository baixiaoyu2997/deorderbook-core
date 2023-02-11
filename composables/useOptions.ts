import type { Option } from 'deorderbook-sdk/subgraph-api'

export interface GetOptionByParams {
  exerciseTimestamp?: string
  strikePrice?: string
}
export const useOptions = () => {
  const { sniperPools } = toRefs(usePoolsStore())
  const { options: originData } = toRefs(useOptionsStore())
  const options = ref([] as Option[])
  // 是否只获取未开始行权的option
  const isNotExercise = ref(false)

  watch(
    [isNotExercise, originData, sniperPools],
    () => {
      // 只需要isActive的option
      options.value = originData.value.filter((option) => {
        const pool = sniperPools.value.find((pool) => pool.id === option.id)
        return pool?.isActive
      })

      if (isNotExercise.value) {
        options.value = options.value.filter((x) => {
          return Date.now() < Number(x.exerciseTimestamp + '000')
        })
      }
    },
    {
      immediate: true,
      deep: true,
    }
  )

  function getOptionBy(params: GetOptionByParams) {
    if (
      params.exerciseTimestamp !== undefined &&
      params.strikePrice !== undefined
    ) {
      return computed(() => {
        return options.value.find((x) => {
          return (
            x.exerciseTimestamp === params.exerciseTimestamp &&
            x.strikePrice === params.strikePrice
          )
        })
      })
    }
    return ref(undefined)
  }

  return {
    options,
    isNotExercise,
    getOptionBy,
  }
}
