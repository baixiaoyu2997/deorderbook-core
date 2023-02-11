export interface UseTimestampOptions {
  /** 返回结果是秒还是毫秒 */
  unit?: 'seconds' | 'milliseconds'
}
/**
 * @description 转换时间戳字符串为指定格式（秒，毫秒）
 * @export
 * @param {string} timestamp 时间戳字符串，单位可以是秒或者毫秒
 * @param {UseTimestampOptions} [options={}]
 * @return {*}
 */
export function useTimestamp(
  timestamp: string,
  options: UseTimestampOptions = {}
) {
  const { unit = 'milliseconds' } = options
  if (unit === 'milliseconds') {
    return timestamp.length <= String(Date.now()).length - 3
      ? timestamp + '000'
      : timestamp
  }

  if (unit === 'seconds') {
    return timestamp.length <= String(Date.now()).length - 3
      ? timestamp
      : timestamp.slice(0, -3)
  }
}
