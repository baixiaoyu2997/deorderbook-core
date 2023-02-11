import { ElNotification } from 'element-plus'
import type { NotificationParams } from 'element-plus/es/components/notification/src/notification'

export type NotifyType = 'success' | 'error'

/**
 * @description 全局消息通知
 */
export function useNotify(options?: NotificationParams) {
  let type: NotifyType = 'success'
  if (options instanceof Object && options?.type) {
    type = options.type as NotifyType
  }

  const defaultOption: Record<NotifyType, NotificationParams> = {
    success: {
      title: '',
      message: 'Operation Succeed',
      offset: 100,
    },
    error: {
      title: '',
      message: 'Operation Failed',
      offset: 100,
    },
  }

  const newOption = Object.assign({}, defaultOption[type], options)
  const customClass = 'y-notify' + ' is-' + type

  if (newOption instanceof Object) {
    ElNotification({
      ...newOption,
      type,
      customClass,
    })
  }
}
