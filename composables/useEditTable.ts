const state = new Map()
/**
 * @description  对edit table进行操作，getEditRows:返回编辑行数据，cancelAll:取消所有编辑行,getColumnInstance:获取当前列实例,getAllInstance:获取所有实例
 * @notice 目前只支持一个页面最多一个table
 */
export const useEditTable = () => {
  // 返回所有编辑行的数据
  const getEditRows = () => {
    const data = []
    state.forEach((value) => {
      data.push(unref(value.data))
    })
    return data
  }
  // 关闭所有编辑组件
  const cancelAll = () => {
    state.forEach((value) => {
      value.toggleReadonly(true)
    })
  }
  /**
   * @description element-plus table中只能获取最后一个组件的ref，故使用该方法获取组件实例。通过`instance.exposed`获取组件导出属性
   * @param {*} scope 当前行的scope
   */
  const getColumnInstance = (scope: any) => {
    return state.get(unref(scope).row)?.instances?.get?.(unref(scope).column)
  }

  /**
   * @description 获取所有实例
   */
  const getAllInstance = () => {
    const list = new Set()
    state.forEach((v) => {
      v.instances.forEach((x) => {
        list.add(x)
      })
    })
    return [...list]
  }
  return {
    state,
    getEditRows,
    cancelAll,
    getColumnInstance,
    getAllInstance,
  }
}
