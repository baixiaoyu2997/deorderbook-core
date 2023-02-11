export const useBackground = () => {
  const partsOfDay = ['dawn', 'morning', 'afternoon', 'sunset', 'night']
  const currentHour = ref(+new Date().getHours())
  const partsOfDayName = ref(
    partsOfDay[Math.floor(currentHour.value / partsOfDay.length)]
  )
  const pagename = ref('')
  const router = useRouter()

  // testing purpose only
  // const currentMin = ref(+new Date().getMinutes())
  // const partsOfDayName = ref(partsOfDay[currentMin.value % partsOfDay.length])

  onMounted(() => {
    const intv = setInterval(() => {
      const newHour = +new Date().getHours()
      if (currentHour.value !== newHour) {
        partsOfDayName.value =
          partsOfDay[Math.floor(newHour / partsOfDay.length)]
        currentHour.value = newHour
      }
    }, 1000)

    // for testing purpose
    // const intv = setInterval(() => {
    //   const newMin = +new Date().getMinutes()
    //   if (currentMin.value !== newMin) {
    //     let newIdx = newMin % 4
    //     if (+new Date().getHours() === newIdx) {
    //       if (newIdx === 3) {
    //         newIdx = 0
    //       } else {
    //         newIdx++
    //       }
    //     }
    //     partsOfDayName.value = partsOfDay[newIdx]
    //     currentMin.value = newMin
    //   }
    // }, 1000)
  })

  watch(
    router.currentRoute,
    () => {
      const fullpath = router.currentRoute.value.fullPath
      pagename.value = fullpath.split('/')[1]
    },
    {
      immediate: true,
      deep: true,
    }
  )

  return {
    pagename,
    partsOfDayName,
  }
}
