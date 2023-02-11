import { Big } from 'big.js'
import type { Ref } from 'vue'
import { exercise as optionExercise } from 'deorderbook-sdk/ethereum/option'
import { div18 } from '~/utils'

interface ExerciseOptions {
  optionType?: Ref<'0' | '1'> | '0' | '1'
  optionAddress?: Ref<string> | string
  bulletAddress?: Ref<string> | string
  /** 用户输入行权的bullet数量 */
  bulletAmount?: Ref<string> | string
  /** 钱包中的bullet */
  bulletBalance?: Ref<string> | string
  /** 行权价格 */
  strikePrice?: Ref<string> | string
  /** 行权时间 */
  exerciseTimestamp: Ref<`${number}`> | `${number}`
}
export function useOptionExercise(options: ExerciseOptions) {
  const loading = useLoading()
  const {
    bulletAmount,
    bulletBalance,
    optionType,
    optionAddress,
    strikePrice,
    exerciseTimestamp,
  } = toRefs(reactive(options))
  const { balanceUHODL, balanceBHODL, queryAllowance, approve } = useWallet()

  // 需要花费掉的hodl的余额
  const spendHODLMax = computed(() => {
    // 这里取反过来的值
    return unref(optionType) === '0'
      ? div18(balanceUHODL.value)
      : div18(balanceBHODL.value)
  })
  // 需要花费掉的hodl
  const spendHODL = computed(() => {
    const symbol = unref(optionType) === '0' ? 'uHODL' : 'bHODL' // 这里取反过来的值
    const amount = Big(unref(bulletAmount) || 0)
    const price = Big(unref(strikePrice) || '0').div(10 ** 18)
    const hodlAmount =
      symbol === 'uHODL' ? amount.times(price) : amount.div(price)
    return hodlAmount.toFixed()
  })

  const disable = computed(() => {
    const now = Date.now()
    const timestamp = Number(unref(exerciseTimestamp))
    return !(now >= timestamp && now < timestamp + 24 * 60 * 60 * 1000)
  })
  const submitDisable = computed(() => {
    // console.log(disable.value)
    // console.log(Number(unref(bulletAmount)) <= 0)
    // console.log(Big(bulletBalance?.value || '0').lt(bulletAmount?.value || '0'))

    return (
      disable.value ||
      isQueryApprove.value ||
      showApprove.value ||
      Number(unref(bulletAmount)) <= 0 ||
      Big(bulletBalance?.value || '0').lt(bulletAmount?.value || '0') ||
      Big(spendHODLMax.value).lt(spendHODL.value)
    )
  })

  const doExercise = async () => {
    return await exerciseOption()
  }

  // [ 授权相关 ]
  const isQueryApprove = ref(false)
  const showApprove = ref(false)
  const approveFrom = computed(() => {
    return optionType?.value === '0' ? 'uHODL' : 'bHODL'
  })
  const doQueryAllowance = async () => {
    isQueryApprove.value = true
    const allowance = await queryAllowance(
      approveFrom.value,
      unref(optionAddress) as string
    ).finally(() => {
      isQueryApprove.value = false
    })
    showApprove.value = Number(allowance) <= 0
  }

  const doApprove = () => {
    loading.show()
    approve(approveFrom.value, unref(optionAddress) as string)
      .then(() => {
        useNotify()
        showApprove.value = false
      })
      .catch((err) => {
        if (err.code !== 'ACTION_REJECTED') {
          useNotify({
            type: 'error',
            message: err.message,
          })
        }
        loading.hide()
      })
      .finally(() => loading.hide())
  }

  const exerciseOption = () => {
    loading.show()
    const amount = Big(unref(bulletAmount) as string)
      .times(10 ** 18)
      .toFixed()

    return optionExercise(unref(optionAddress) as string, amount)
      .then((hash) => {
        const { waitTx } = useWaitTx(hash)
        return waitTx()
          .then((result) => {
            if (result.status === 1) {
              const { actionRefreshOptionAccounts } = toRefs(
                useOptionAccountsStore()
              )
              actionRefreshOptionAccounts.value(true)
              useNotify()
            } else {
              useNotify({
                type: 'error',
              })
            }
          })
          .catch((err) => {
            useNotify({
              type: 'error',
              message: err.message,
            })
          })
      })
      .catch((err) => {
        if (err.code !== 'ACTION_REJECTED') {
          useNotify({
            type: 'error',
            message: err.message,
          })
        }
      })
      .finally(() => {
        loading.hide()
      })
  }

  return {
    disable,
    submitDisable,
    doExercise,
    showApprove,
    doQueryAllowance,
    doApprove,
  }
}
