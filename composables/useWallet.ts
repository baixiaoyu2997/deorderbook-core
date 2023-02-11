import { Big } from 'big.js'
import {
  connectWallet,
  allowance,
  approve as chainApprove,
} from 'deorderbook-sdk'
import { initWalletStore, wallet } from 'deorderbook-sdk/store'
import { Ref } from 'vue'
import { ContractTransaction } from 'ethers'
import { useWaitTx } from '~/composables/useWaitTx'

const installWallet = (walletType: string) => {
  initWalletStore({ type: walletType }).install()
}

const initMetaMask = (
  type: string,
  address: Ref<string>,
  isConnected: Ref<boolean>,
  setIsLogged: any
) => {
  return connectWallet({ type }).then(async (res) => {
    // -1：未安装插件，0：未成功，1：成功
    if (res === 1) {
      address.value = (await wallet?.getAddress()) ?? ''
      isConnected.value = true
      setIsLogged(true, type)
    } else if (res === -1) {
      if (type === 'metamask') {
        window.open('https://metamask.io/')
        useNotify({
          type: 'error',
          message: 'After installed MetaMask, Please refresh!',
        })
      } else {
        installWallet(type)
      }
    }
    return res
  })
}

export const useWallet = () => {
  const { setIsLogged } = useAppStore()
  const walletStore = useWalletStore()

  const { address, txHash, resetWallet, setBalance, isConnected, tokensInfo } =
    toRefs(walletStore)

  const connectWallet = (type: string) => {
    if (!useIsClient()) return Promise.resolve(1)
    if (!isConnected.value) {
      if (type === 'metamask') {
        return initMetaMask(type, address, isConnected, setIsLogged)
      } else {
        return Promise.reject(new Error(`Unknown wallet type: ${type}`))
      }
    }
    return Promise.resolve(1)
  }
  const disconnect = () => {
    wallet?.disconnect()
    resetWallet.value()
    setIsLogged(false, '')
    window.location.reload()
  }

  // [币种交易相关]
  const queryAllowance = (symbol: string, to: string, contracts?) => {
    if (address.value === '') {
      console.error('address is null, please use onWalletReady')
    }
    const toAddress = to.indexOf('0x') === 0 ? to : tokensInfo.value[to].address
    return allowance(symbol, address.value, toAddress, contracts).then(
      (amount) => {
        if (amount.gt(0)) {
          if (tokensInfo.value[symbol]) {
            tokensInfo.value[symbol].approveSymbols.add(to)
          } else {
            tokensInfo.value[symbol] = {
              approveSymbols: new Set([to]),
            }
          }
        } else if (tokensInfo.value[symbol]) {
          tokensInfo.value[symbol].approveSymbols.delete(to)
        } else {
          tokensInfo.value[symbol] = {
            ...tokensInfo.value[symbol],
            approveSymbols: new Set(),
          }
        }
        return amount.toString()
      }
    )
  }

  const approve = (fromSymbol, to, contracts?) => {
    const toAddress = to.indexOf('0x') === 0 ? to : tokensInfo.value[to].address
    // fromSymbol授权toSymbol合约交易
    return chainApprove(fromSymbol, toAddress, contracts)
      .then((resp) => {
        const { waitTx } = useWaitTx(resp, 'approve')
        return waitTx().then((result) => {
          if (result.status === 1) {
            if (tokensInfo.value[fromSymbol]) {
              tokensInfo.value[fromSymbol].approveSymbols.add(to)
            } else {
              tokensInfo.value[fromSymbol] = {
                approveSymbols: new Set([to]),
              }
            }
          }
        })
      })
      .catch((err) => {
        useNotify({
          type: 'error',
          message: err.message,
        })
        return Promise.reject(err)
      })
  }

  /** @deprecated 已弃用，应该拆分query和approve操作，动态显示approve按钮 */
  const queryAndApprove = async ({
    from,
    to,
    contracts,
  }: {
    from: string
    to: string
    contracts?: string
  }) => {
    await queryAllowance(from, to, contracts)
    if (!tokensInfo.value[from].approveSymbols.has(to)) {
      try {
        await approve(from, to, contracts)
      } catch (error) {
        console.log(error)
        return Promise.reject(error)
      }
    }
  }
  /**
   * @description 如果没有批准过，那么允许合约交易,参数fromSymbol、to(可以为地址或者symbol)、deorderbook-sdk中的方法、contract：调用合约实例
   * @deprecated 已弃用，应该拆分交易操作和approve操作
   */
  const txWithApprove = async (from, to, req, contracts?) => {
    await queryAllowance(from, to, contracts)
    if (!tokensInfo.value[from].approveSymbols.has(to)) {
      try {
        await approve(from, to, contracts)
      } catch (error) {
        console.log(error)
        return Promise.reject(error)
      }
    }

    return req()
      .then(async (resp: ContractTransaction) => {
        const { waitTx } = useWaitTx(resp)
        return waitTx()
          .then((result) => {
            txHash.value = null
            return result
          })
          .catch((error) => {
            return Promise.reject(error)
          })
      })
      .catch((error: Error) => {
        const { hide } = useLoading()
        hide()
        return Promise.reject(error)
      })
  }

  // 展示币值
  const formatCoin = (val, coin) => {
    if (!val) return new Big('0')
    const decimals = coin ? tokensInfo.value[coin].decimals : 18
    const y = new Big(10).pow(decimals)
    const x = new Big(val).div(y)
    return x
  }

  return {
    connectWallet,
    disconnectWallet: disconnect,
    installWallet,
    /** @deprecated 已弃用，应该拆分query和approve操作，动态显示approve按钮 */
    queryAndApprove,
    /** @deprecated 已弃用，应该拆分交易操作和approve操作 */
    txWithApprove,
    formatCoin,
    queryAllowance,
    approve,
    ...toRefs(walletStore),
    tokensInfo: tokensInfo.value,
  }
}
