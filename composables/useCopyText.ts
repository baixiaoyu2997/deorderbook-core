/**
 * 拷贝元素文字，不能用于display:none;或者visibility: hidden;的元素上，可以使用`position: absolute;top: 0;z-index: -1;`让元素不可见并且可以复制
 */
export default () => {
  const copy = (el) => {
    if (!useIsClient()) return
    const selection = window.getSelection()
    if (selection) {
      // 清空selection对象
      selection.removeAllRanges()
      // 创建一个Range实例

      const range = new Range()
      range.selectNodeContents(el)

      // selection对象设置range实例
      selection.addRange(range)

      document.execCommand('Copy')
      selection.removeAllRanges()
    }
  }
  return {
    copy,
  }
}
