type SFCType = 'component' | 'page' | 'layout' | 'app'
/**
 * @description 判断当前是页面还是组件
 */
export default function () {
  let type: SFCType = 'component'
  const { proxy } = getCurrentInstance()
  if (proxy.$parent.$parent === null) {
    type = 'app'
  } else if ('is-layout' in proxy.$.attrs) {
    type = 'layout'
  } else if ('pageKey' in proxy.$parent) {
    type = 'page'
  }

  return {
    type,
    notPage: type !== 'page',
    notLayout: type !== 'layout',
    notComponent: type !== 'component',
    notApp: type !== 'app',
  }
}
