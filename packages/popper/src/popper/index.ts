import {
  computed,
  ref,
  reactive,
  watch,
} from 'vue'
import { createPopper } from '@popperjs/core'

import {
  generateId,
  isBool,
  isHTMLElement,
  isArray,
  isString,
} from '@element-plus/utils/util'

import usePopperOptions from './popper-options'

import type { ComponentPublicInstance, SetupContext } from 'vue'
import type { IPopperOptions, TriggerType, PopperInstance, RefElement } from './defaults'

export const DEFAULT_TRIGGER = ['hover']
export const UPDATE_VISIBLE_EVENT = 'update:visible'
export default function (props: IPopperOptions, { emit }: SetupContext<string[]>) {
  const arrowRef = ref<RefElement>(null)
  const triggerRef = ref<ComponentPublicInstance | HTMLElement>(null)
  const popperRef = ref<RefElement>(null)

  const popperId = `el-popper-${generateId()}`
  let popperInstance: Nullable<PopperInstance> = null
  let showTimer: Nullable<TimeoutHandle> = null
  let hideTimer: Nullable<TimeoutHandle> = null
  let triggerFocused = false

  const isManualMode = () => props.manualMode || props.trigger === 'manual'

  const popperOptions = usePopperOptions(props, {
    arrow: arrowRef,
  })

  const state = reactive({
    visible: !!props.visible,
  })
  // visible has been taken by props.visible, avoiding name collision
  const visibility = computed<boolean>({
    get() {
      if (props.disabled) {
        return false
      } else {
        return isBool(props.visible) ? props.visible : state.visible
      }
    },
    set(val) {
      if (isManualMode()) return
      isBool(props.visible) ? emit(UPDATE_VISIBLE_EVENT, val) : state.visible = val
    },
  })

  function _show() {
    if (props.hideAfter > 0) {
      hideTimer = window.setTimeout(() => {
        _hide()
      }, props.hideAfter)
    }
    visibility.value = true
    popperInstance.update()
  }

  function _hide() {
    visibility.value = false
  }

  function clearTimers() {
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
  }

  const show = () => {
    if (isManualMode() || props.disabled) return
    clearTimers()
    if (props.showAfter === 0) {
      _show()
    } else {
      showTimer = window.setTimeout(() => {
        _show()
      }, props.showAfter)
    }
  }

  const hide = () => {
    if (isManualMode()) return
    clearTimers()
    if (props.closeDelay > 0) {
      hideTimer = window.setTimeout(() => {
        close()
      }, props.closeDelay)
    } else {
      close()
    }
  }
  const close = () => {
    _hide()
    if (props.disabled) {
      doDestroy(true)
    }
  }

  function onPopperMouseEnter() {
    if (props.enterable) {
      clearTimeout(hideTimer)
    }
  }

  function onPopperMouseLeave() {
    const { trigger } = props
    const shouldPrevent =
      (isString(trigger) && (trigger === 'click' || trigger === 'focus')) ||
      // we'd like to test array type trigger here, but the only case we need to cover is trigger === 'click' or
      // trigger === 'focus', because that when trigger is string
      // trigger.length === 1 and trigger[0] === 5 chars string is mutually exclusive.
      // so there will be no need to test if trigger is array type.
      (trigger.length === 1 &&
        (trigger[0] === 'click' || trigger[0] === 'focus'))

    if (shouldPrevent) return

    hide()
  }

  function initializePopper() {
    const _trigger = isHTMLElement(triggerRef.value)
      ? triggerRef.value
      : (triggerRef.value as ComponentPublicInstance).$el
    detachPopper()
    popperInstance = createPopper(
      _trigger,
      popperRef.value,
      popperOptions.value,
    )

    popperInstance.update()
  }

  function doDestroy(forceDestroy?: boolean) {
    /* istanbul ignore if */
    if (!popperInstance || (visibility.value && !forceDestroy)) return
    detachPopper()
  }

  function detachPopper() {
    popperInstance?.destroy?.()
    popperInstance = null
  }

  const events = {} as {
    onClick?: (e: Event) => void
    onMouseEnter?: (e: Event) => void
    onMouseLeave?: (e: Event) => void
    onFocus?: (e: Event) => void
    onBlur?: (e: Event) => void
  }

  if (!isManualMode()) {
    const toggleState = () => {
      if (visibility.value) {
        hide()
      } else {
        show()
      }
    }

    const popperEventsHandler = (e: Event) => {
      e.stopPropagation()
      switch (e.type) {
        case 'click': {
          if (triggerFocused) {
            // reset previous focus event
            triggerFocused = false
          } else {
            toggleState()
          }
          break
        }
        case 'mouseenter': {
          show()
          break
        }
        case 'mouseleave': {
          hide()
          break
        }
        case 'focus': {
          triggerFocused = true
          show()
          break
        }
        case 'blur': {
          triggerFocused = false
          hide()
          break
        }
      }
    }

    const mapEvents = (t: TriggerType) => {
      switch (t) {
        case 'click': {
          events.onClick = popperEventsHandler
          break
        }
        case 'hover': {
          events.onMouseEnter = popperEventsHandler
          events.onMouseLeave = popperEventsHandler
          break
        }
        case 'focus': {
          events.onFocus = popperEventsHandler
          events.onBlur = popperEventsHandler
          break
        }
        default: {
          break
        }
      }
    }
    if (isArray(props.trigger)) {
      Object.values(props.trigger).map(mapEvents)
    } else {
      mapEvents(props.trigger)
    }
  }

  watch(popperOptions, val => {
    if (!popperInstance) return
    popperInstance.setOptions(val)
    popperInstance.update()
  })

  // watch(visibility, () => {
  //   if (popperInstance.value) {
  //     popperInstance.value.update()
  //   } else {
  //     initializePopper()
  //   }
  // })

  // onMounted(initializePopper)

  // onUpdated(initializePopper)

  // onBeforeUnmount(() => {
  //   doDestroy(true)
  // })

  // onActivated(initializePopper)

  // onDeactivated(() => {
  //   doDestroy(true)
  // })

  return {
    doDestroy,
    show,
    hide,
    onPopperMouseEnter,
    onPopperMouseLeave,
    onAfterEnter: () => {
      emit('after-enter')
    },
    onAfterLeave: () => {
      emit('after-leave')
    },
    initializePopper,
    arrowRef,
    events,
    popperId,
    popperInstance,
    popperRef,
    triggerRef,
    visibility,
  }
}
