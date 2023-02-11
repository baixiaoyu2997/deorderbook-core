const pageMap = new Map()
export const usePageInit = (cb?: () => any) => {
  // TODO: 使用 scope 销毁
  const { name } = useRoute()
  const { type } = useSFCType()

  if (type !== 'page' && cb) {
    console.warn('usePageInit:不要在非page中传入初始化函数')
  } else if (type === 'page' && !pageMap.has(name)) {
    if (cb) {
      pageMap.set(name, cb)
    } else {
      console.warn('usePageInit:本页面未传入初始化函数')
    }
  }

  return {
    pageInit: pageMap.get(name),
  }
}
