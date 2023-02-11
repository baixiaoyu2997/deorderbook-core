import Big from 'big.js'
import { getTokenBySymbol } from 'deorderbook-sdk'
import { useMarketBulletContract } from 'deorderbook-sdk/store/marketBulletContract'
import {
  bulkCancel,
  bulkOffer,
  bulkUpdate,
  cancel as marketBulletCancel,
} from 'deorderbook-sdk/ethereum/market_bullet'

// 顺序执行approve，第一个拒绝则直接停止后续
function startPromise(arr: any[]) {
  return new Promise((resolve, reject) => {
    sequencePromise(arr)

    function sequencePromise(arr: any[]) {
      const fn = arr.shift()
      if (fn) {
        fn()
          .then(() => {
            sequencePromise(arr)
          })
          .catch((err) => {
            reject(err)
          })
      } else {
        resolve(true)
      }
    }
  })
}
const useBulkTxWithApprove = async (
  from: string[],
  to: string[],
  req,
  contracts?
) => {
  const { queryAllowance, tokensInfo, approve } = useWallet()

  const checkAndApprove = (from, to, contracts) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      await queryAllowance(from, to, contracts)
      if (!tokensInfo[from].approveSymbols.has(to)) {
        try {
          resolve(await approve(from, to, contracts))
        } catch (error) {
          reject(error)
        }
      } else {
        resolve(true)
      }
    })
  }

  const promises = from.map(
    (item, index) => () => checkAndApprove(item, to[index], contracts)
  )

  try {
    await startPromise(promises)
    return req()
      .then((hash) => {
        if (hash instanceof Object) {
          hash = hash.transactionHash
        }
        const { waitTx } = useWaitTx(hash)
        return waitTx()
      })
      .catch((err) => {
        console.log(err, 'tx error')
      })
  } catch (error) {
    return Promise.reject(error)
  }
}

const cancelMyBullet = (id, fn) => {
  const loading = useLoading()
  loading.show()
  marketBulletCancel(id)
    .then((hash) => {
      if (hash instanceof Object) {
        hash = hash.transactionHash
      }
      const { waitTx } = useWaitTx(hash)
      waitTx()
        .then((result) => {
          if (result.status === 1) {
            useNotify()
            fn()
          } else {
            useNotify({
              type: 'error',
            })
          }
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
    })
    .catch((err) => {
      if (err.code !== 'ACTION_REJECTED') {
        useNotify({
          type: 'error',
          message: err.message,
        })
      }
      console.error(err)
      loading.hide()
    })
}

const editFormatSell = (item, bulkObjSell) => {
  const bulletTokenAddress = item.bullet
  bulkObjSell.toAddresses.push(useMarketBulletContract().options.address)
  const price = Big(item.OTCPrice).times(Big(10).pow(18)).toFixed()
  const sellAmount = Big(item.amount).times(Big(10).pow(18)).toFixed()
  const uHODL = getTokenBySymbol('uHODL')
  const bHODL = getTokenBySymbol('uHODL')
  const buyAddress =
    Number(item.optionType) === 1 ? uHODL.address : bHODL.address

  bulkObjSell.price.push(sellAmount)
  bulkObjSell.bulletAddress.push(bulletTokenAddress)
  bulkObjSell.buy.push(buyAddress)
  bulkObjSell.totalPrice.push(Big(price).times(item.amount).toFixed())
  bulkObjSell.OTCOpenTime.push(Date.now() + item.OTCOpenTime)
}

const editFormatUpdate = (item, obj) => {
  const buyAmount = Big(Number(item.amount || 0))
    .times(Number(item.OTCPrice || 0))
    .times(Big(10).pow(18))
    .toFixed()

  obj.id.push(item.markerBulletId)
  obj.buyAmount.push(buyAmount)
  obj.OTCOpenTime.push(Date.now() + item.OTCOpenTime)
}

const getBodyTop = (item, top) => {
  if (item.offsetParent.nodeName !== 'BODY') {
    const toParentTop = item.offsetTop + top
    getBodyTop(item.offsetParent, toParentTop)
  }
  return top
}

const setTableHeight = (height) => {
  const tableBody = document.querySelector(
    '.el-table__body-wrapper .el-scrollbar__wrap'
  )
  if (!tableBody) {
    setTimeout(() => {
      setTableHeight(height)
    }, 200)
  } else {
    tableBody.style.maxHeight = height
  }
}

const getTableHeight = () => {
  const wrapperTableBody = document.querySelector('.my-bullet--table__body')
  if (!wrapperTableBody) {
    setTimeout(() => {
      getTableHeight()
    }, 100)
    return
  }
  const windowHeight = window.innerHeight
  const top = getBodyTop(wrapperTableBody, wrapperTableBody.offsetTop) + 130
  const bottomHeight = 79 + 40
  const height =
    windowHeight - top - bottomHeight < 486
      ? 486
      : windowHeight - top - bottomHeight
  setTableHeight(height + 'px')
}

class ErrorMsgClass {
  errorMsg: {
    amount: { value: boolean; content: string }
    OTCPrice: { value: boolean; content: string }
    OTCTime: { value: boolean; content: string }
    OTCTimeExpiry: { value: boolean; content: string }
  }

  constructor() {
    this.errorMsg = reactive({
      amount: {
        value: false,
        content: 'Amount must be greater than 0',
      },
      OTCPrice: {
        value: false,
        content: 'OTC Price must be greater than 0',
      },
      OTCTime: {
        value: false,
        content: 'OTC Open Time must be greater than 0',
      },
      OTCTimeExpiry: {
        value: false,
        content: 'The OTC Open time is beyond BULLET Expiry date',
      },
    })
  }

  cancelErrorMsg() {
    for (const i in this.errorMsg) {
      this.errorMsg[i].value = false
    }
  }

  checkErrorMsg(editRows) {
    let errorMsgExist = false
    const errorMsg = this.errorMsg
    this.cancelErrorMsg()
    for (let j = 0; j < editRows.length; j++) {
      if (Number(editRows[j].amount) <= 0) {
        errorMsg.amount.value = true
      }
      if (Number(editRows[j].OTCPrice) <= 0) {
        errorMsg.OTCPrice.value = true
      }
      if (Number(editRows[j].OTCOpenTime) <= 0) {
        errorMsg.OTCTime.value = true
      }
      if (
        Number(editRows[j].OTCOpenTime) + Date.now() >
        Number(editRows[j].exerciseTimestamp)
      ) {
        errorMsg.OTCTimeExpiry.value = true
      }
    }
    Object.values(errorMsg).forEach((i) => {
      if (i.value) {
        errorMsgExist = true
      }
    })
    return errorMsgExist
  }

  checkErrorMsgDialog(d) {
    const errorMsg = this.errorMsg
    errorMsg.amount.value = d.amount <= 0
    errorMsg.OTCPrice.value = Number(d.price) <= 0
    errorMsg.OTCTime.value =
      Number(d.hourValue) === 0 && Number(d.minsValue) === 0
    errorMsg.OTCTimeExpiry.value =
      Number(d.exerciseTimestamp) <
      new Date().getTime() +
        d.hourValue * 60 * 60 * 1000 +
        d.minsValue * 60 * 1000

    return (
      errorMsg.amount.value ||
      errorMsg.OTCPrice.value ||
      errorMsg.OTCTime.value ||
      errorMsg.OTCTimeExpiry.value
    )
  }
}

const bulkSellOption = (bullets, to, data, loading, cb) => {
  loading.show()
  useBulkTxWithApprove(
    bullets,
    to,
    () =>
      bulkOffer(
        data.price,
        data.bulletAddress,
        data.totalPrice,
        data.buy,
        data.OTCOpenTime
      ),
    'erc20Contracts'
  )
    .then((result) => {
      if (result.status === 1) {
        useNotify()
        cb()
      } else {
        useNotify({
          type: 'error',
        })
      }
    })
    .catch((err) => {
      if (err.code !== 'ACTION_REJECTED') {
        useNotify({
          type: 'error',
          message: err.message,
        })
      }
      return Promise.reject(err)
    })
    .finally(() => {
      loading.hide()
    })
}

const bulkUpdateOption = (ids, buyAmount, OTCOpenTime, loading, cb) => {
  loading.show()

  bulkUpdate(ids, buyAmount, OTCOpenTime)
    .then((hash) => {
      if (hash instanceof Object) {
        hash = hash.transactionHash
      }
      const { waitTx } = useWaitTx(hash)
      waitTx()
        .then((result) => {
          if (result.status === 1) {
            useNotify()
            cb()
          }
        })
        .finally(() => {
          loading.hide()
        })
    })
    .catch((err) => {
      if (err.code !== 'ACTION_REJECTED') {
        useNotify({
          type: 'error',
          message: err.message,
        })
      }
      loading.hide()
      return Promise.reject(err)
    })
}

const bulkCancelOption = (ids, loading, cb) => {
  loading.show()
  bulkCancel(ids)
    .then((resp) => {
      const { waitTx } = useWaitTx(resp)
      waitTx()
        .then((result) => {
          if (result.status === 1) {
            useNotify()
            cb()
          }
        })
        .finally(() => {
          loading.hide()
        })
    })
    .catch((err) => {
      if (err.code !== 'ACTION_REJECTED') {
        useNotify(err.message)
      }
      loading.hide()
      return Promise.reject(err)
    })
}

export const useBulletBulkOption = () => {
  return {
    cancelMyBullet,
    editFormatSell,
    editFormatUpdate,
    getTableHeight,
    ErrorMsgClass,
    bulkSellOption,
    bulkUpdateOption,
    bulkCancelOption,
  }
}
