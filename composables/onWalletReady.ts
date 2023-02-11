import { storeToRefs } from 'pinia'

export interface WalletReadyOptions {
  /**
   * 调用时机,setup:钱包初始化,可以调用不需要账户信息的合约方法。connected:连接账户钱包后执行
   */
  status: 'setup' | 'connected'
}

/**
 * @description 钩子函数，确保可以调用合约方法，默认为连接账户后执行，可以通过options修改调用时机
 * @param {() => void} cb 回调函数
 * @param {*} [options={} as WalletReadyOptions]
 */
export function onWalletReady(
  cb: () => void,
  options = {} as WalletReadyOptions
) {
  const { status = 'connected' } = options
  const { isSetOption, isConnected } = storeToRefs(useWalletStore())
  let watchValue: typeof isSetOption | typeof isConnected
  if (status === 'connected') {
    watchValue = isConnected
  } else if (status === 'setup') {
    watchValue = isSetOption
  }

  const doWatch = () => {
    watch(
      watchValue,
      (newValue) => {
        if (newValue) {
          cb?.()
        }
      },
      {
        immediate: true,
      }
    )
  }
  onBeforeMount(() => {
    doWatch()
  })
}
