/**
 * @description 返回指定option的fee,option的fee是可以手动修改的，所以涉及到option的fee，都应该手动获取
 * @param {Ref<string>} address
 */
export const useOptionFee = (address: string) => {
  const {
    fetchRedeemFeeRatioState,
    fetchBulletToRewardRatio,
    fetchExerciseFeeRatio,
    fetchWithdrawFeeRatio,
  } = toRefs(useOptionFeeStore())

  const redeemFeeRatio = fetchRedeemFeeRatioState.value(address)

  const bulletToRewardRatio = fetchBulletToRewardRatio.value(address)

  const exerciseFeeRatio = fetchExerciseFeeRatio.value(address)

  const withdrawFeeRatio = fetchWithdrawFeeRatio.value(address)

  return {
    redeemFeeRatio,
    redeemFeeRatioString: computed(
      () => Number(redeemFeeRatio.value?.state || '0') * 100 + '%' // 返回带有%符号的字符串
    ),
    exerciseFeeRatio,
    exerciseFeeRatioString: computed(
      () => Number(exerciseFeeRatio.value?.state || '0') * 100 + '%' // 返回带有%符号的字符串
    ),
    withdrawFeeRatio,
    withdrawFeeRatioString: computed(
      () => Number(withdrawFeeRatio.value?.state || '0') * 100 + '%' // 返回带有%符号的字符串
    ),
    bulletToRewardRatio,
    bulletToRewardRatioString: computed(
      () => Number(bulletToRewardRatio.value?.state || '0') * 100 + '%' // 返回带有%符号的字符串
    ),
  }
}
