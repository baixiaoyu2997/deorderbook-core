import { TABLE_INJECTION_KEY } from 'element-plus/es/components/table/src/tokens'
const ElInjectEnum = {
  table: TABLE_INJECTION_KEY,
}
/**
 * @description 获取当前el组件provide的实例,有需要的自己扩展
 */
export const useElInject = (key: keyof typeof ElInjectEnum) => {
  return inject(ElInjectEnum[key])
}
