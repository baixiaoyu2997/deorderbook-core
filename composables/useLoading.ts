import { ElLoading } from 'element-plus'
/**
 *  目前只支持全屏loading
 */
export const useLoading = () => {
  // [Init Cache]
  const { loadingInstance } = toRefs(useAppStore())

  const show = (
    options = { fullscreen: true, background: 'rgba(21, 21, 21, 0.75)' }
  ) => {
    loadingInstance.value = ElLoading.service(options)
  }
  const hide = () => {
    loadingInstance.value?.close()
  }

  return {
    show,
    hide,
  }
}
