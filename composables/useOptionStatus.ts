/**
 * @description 根据行权时间判断当前option状态
 * @param {string} timestamp 单位秒
 */
export function useOptionStatus(timestamp: string) {
  const status = computed(() => {
    let status = '' as
      | 'unStartedExercise'
      | 'unStartedCollect'
      | 'startedCollect'
    if (Date.now() < Number(timestamp + '000')) {
      status = 'unStartedExercise'
    } else if (Date.now() < Number(timestamp + '000') + 24 * 60 * 60 * 1000) {
      status = 'unStartedCollect'
    } else {
      status = 'startedCollect'
    }
    return status
  })
  return {
    status,
  }
}
