import type { WorkbenchState } from './types'
import { create } from 'zustand'
import { createTemplateEditorSlice } from './template-editor'
import { createTemplatePublisherSlice } from './template-publisher'
import { createTemplatesLoaderSlice } from './templates-loader'

const useTemplateWorkbenchStore = create<WorkbenchState>()((set, get) => ({
  ...createTemplatesLoaderSlice(set),
  ...createTemplateEditorSlice(set, get),
  ...createTemplatePublisherSlice(set, get),
}))

export default useTemplateWorkbenchStore
export type { WorkbenchState } from './types'
