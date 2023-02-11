import dayjs from 'dayjs';

export const useSniperUnwind = () => {

  function unwindable(exerciseTimestamp: number | string): boolean {
    const now = dayjs()
    const tmpExerciseTimestamp = exerciseTimestamp.toString().length === now.valueOf().toString().length
      ? Number(exerciseTimestamp)
      : Number(exerciseTimestamp) * 1000
    if (dayjs(tmpExerciseTimestamp).isAfter(now)) {
      return true
    }
    return false
  }

  return {
    unwindable,
  }
}

