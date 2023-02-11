// 返回值绑定到组件顶级属性,组件应为position:relative布局
// 需要父组件传入label属性
export default () => {
  const { proxy } = getCurrentInstance() as any

  return {
    labelStyle: computed(() => ({ '--form-label': `"${proxy.label}"` })),
    labelClass: computed(() => ({ 'form__label--has': !!proxy.label })),
  }
}
