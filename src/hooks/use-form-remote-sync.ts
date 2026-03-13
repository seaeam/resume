import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { isEqual } from 'lodash'
import { useEffect, useRef } from 'react'

/**
 * 同步远程（Automerge）store 变更到 react-hook-form 实例。
 *
 * react-hook-form 的 `defaultValues` 仅在初始化时读取一次，
 * 当远程协作者通过 Automerge 修改数据并更新 Zustand store 后，
 * 本地的 form 实例不会自动感知变化。
 *
 * 该 hook 监听 store 数据变化，通过深比较判断是否为远程更新，
 * 并调用 `form.reset()` 将远程数据同步到 form。
 *
 * 返回 `isResettingRef`，调用方应在 `form.watch` 回调中检查该 ref，
 * 以避免 form.reset → watch → updateForm 的循环广播。
 *
 * 该 Hook 只负责“远程数据进入表单”的同步路径，不负责把本地表单修改反推回 store。
 * 因此它通常与 form 的 `watch` / `subscribe` 逻辑配合使用，
 * 一进一出共同完成本地与协作状态的双向同步。
 *
 * @param form react-hook-form 实例
 * @param storeData 从 Zustand 或协作 store 中读取到的最新远程表单数据
 * @returns 一个 ref 对象；当 `current === true` 时表示本次变更来自远程重置，调用方应跳过向远端回写
 */
export function useFormRemoteSync<T extends FieldValues>(
  form: UseFormReturn<T>,
  storeData: T,
) {
  const isResettingRef = useRef(false)

  useEffect(() => {
    // 取当前 form 内部值与 store 值比较
    const currentFormValues = form.getValues()

    if (!isEqual(currentFormValues, storeData)) {
      isResettingRef.current = true
      form.reset(storeData)

      // 使用 setTimeout 确保 react-hook-form 内部处理完 reset 引发的 watch 回调后再复位
      const cleanup = setTimeout(() => {
        isResettingRef.current = false
      }, 0)

      return () => clearTimeout(cleanup)
    }
  }, [storeData, form])

  return isResettingRef
}
