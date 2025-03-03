import { onMounted, onUpdated, onBeforeUnmount,ref, watch, Ref } from 'vue'
import { eventKeys } from '@element-plus/utils/aria'
import { on, off } from '@element-plus/utils/dom'

interface UseKeydownOption {
  el$: Ref<HTMLElement>
}
export function useKeydown({ el$ }: UseKeydownOption) {
  const treeItems = ref<Nullable<HTMLElement>[]>([])
  const checkboxItems = ref<Nullable<HTMLElement>[]>([])

  onMounted(() => {
    initTabIndex()
    on(el$.value, 'keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    off(el$.value, 'keydown', handleKeydown)
  })

  onUpdated(() => {
    treeItems.value = Array.from(el$.value.querySelectorAll('[role=treeitem]'))
    checkboxItems.value = Array.from(el$.value.querySelectorAll('input[type=checkbox]'))
  })

  watch(checkboxItems, val => {
    val.forEach(checkbox => {
      checkbox.setAttribute('tabindex', '-1')
    })
  })

  const handleKeydown = (ev: KeyboardEvent): void => {
    const currentItem = ev.target as HTMLElement
    if (currentItem.className.indexOf('el-tree-node') === -1) return
    const keyCode = ev.keyCode
    treeItems.value = Array.from(el$.value.querySelectorAll('.is-focusable[role=treeitem]'))
    const currentIndex = treeItems.value.indexOf(currentItem)
    let nextIndex
    if ([eventKeys.up, eventKeys.down].indexOf(keyCode) > -1) {
      ev.preventDefault()
      if (keyCode === eventKeys.up) {
        nextIndex = currentIndex !== 0 ? currentIndex - 1 : 0
      } else {
        nextIndex = (currentIndex < treeItems.value.length - 1) ? currentIndex + 1 : 0
      }
      treeItems.value[nextIndex].focus()
    }
    if ([eventKeys.left, eventKeys.right].indexOf(keyCode) > -1) {
      ev.preventDefault()
      currentItem.click()
    }
    const hasInput = currentItem.querySelector('[type="checkbox"]') as Nullable<HTMLInputElement>
    if ([eventKeys.enter, eventKeys.space].indexOf(keyCode) > -1 && hasInput) {
      ev.preventDefault()
      hasInput.click()
    }
  }

  const initTabIndex = (): void => {
    treeItems.value = Array.from(el$.value.querySelectorAll('.is-focusable[role=treeitem]'))
    checkboxItems.value = Array.from(el$.value.querySelectorAll('input[type=checkbox]'))
    const checkedItem = el$.value.querySelectorAll('.is-checked[role=treeitem]')
    if (checkedItem.length) {
      checkedItem[0].setAttribute('tabindex', '0')
      return
    }
    treeItems.value[0]?.setAttribute('tabindex', '0')
  }
}
