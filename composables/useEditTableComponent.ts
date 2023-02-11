/**
 * @description  edit table组件通用逻辑, 组件值必须通过setColumnNewValue传入
 */
export const useEditTableComponent = (columnScope) => {
  const instance = getCurrentInstance()
  // 编辑状态
  const isReadonly = ref(true)
  // 当前行是否禁用
  const rowSelectable = computed(() => {
    return (
      !columnScope.value.store.states.selectable.value ||
      columnScope.value.store.states.selectable.value(
        columnScope.value.row,
        columnScope.value.$index
      )
    )
  })
  const toggleReadonly = (bool: boolean) => {
    if (!rowSelectable.value) return
    isReadonly.value = bool
    columnScope.value.store.toggleRowSelection(columnScope.value.row, !bool)
  }
  // 当前column初始值
  const columnValue = ref(
    Number(columnScope.value.row[columnScope.value.column.property])
  )
  const returnColumnValue = computed(() => {
    return {
      [columnScope.value.column.property]: unref(getNewValue.value?.()),
    }
  })
  const getNewValue = ref(() => columnValue)
  // 返回returnRowData数据和自定义的key的值
  const setColumnNewValue = (cb: () => any) => {
    getNewValue.value = cb
  }

  // [ 绑定组件数据到useEditTable ]
  const { state } = useEditTable()

  // 通过判断编辑状态添加、删除editTable中的state
  watch(
    [isReadonly, returnColumnValue],
    () => {
      if (isReadonly.value) {
        state.delete(columnScope.value.row)
      } else {
        const rowData =
          state.get(columnScope.value.row)?.data || columnScope.value.row
        const instances =
          state.get(columnScope.value.row)?.instances || new Map()
        instances.set(columnScope.value.column, instance)

        state.set(columnScope.value.row, {
          instances,
          data: {
            ...rowData,
            ...unref(returnColumnValue),
          },
          toggleReadonly,
        })
      }
    },
    {
      immediate: true,
    }
  )

  // [ElTable]
  let oldSelection = [] // store传递的oldValue为对象引用，始终和newValue相等，需要手动维护
  const selectionChange = ref((selected: boolean) => {
    // 默认没有设置onRowSelectionChange监听事件时，勾选当前行，自动还原编辑状态的值为初始值
    if (!selected) return
    const currentValue = getNewValue.value?.()
    if (isRef(currentValue)) {
      currentValue.value = columnValue.value
    }
  })
  // 监听table选中行的勾选状态
  const onRowSelectionChange = (cb: (selected: boolean) => void) => {
    selectionChange.value = cb
  }
  watch(
    columnScope.value.store.states.selection,
    (newValue: Array<unknown>) => {
      if (newValue.includes(columnScope.value.row)) {
        isReadonly.value = false
        // 只有当前行勾选时才触发
        if (!oldSelection.includes(columnScope.value.row)) {
          selectionChange.value?.(true)
        }
      } else {
        isReadonly.value = true
        selectionChange.value?.(false)
      }
      oldSelection = [...newValue]
    },
    {
      deep: true,
    }
  )

  return {
    isReadonly,
    rowSelectable,
    columnValue,
    toggleReadonly,
    setColumnNewValue,
    onRowSelectionChange,
  }
}
