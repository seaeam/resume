import type { TemplateEditorSlice } from './template-editor'
import type { TemplatePublisherSlice } from './template-publisher'
import type { TemplatesLoaderSlice } from './templates-loader'

export interface WorkbenchState extends TemplatesLoaderSlice, TemplateEditorSlice, TemplatePublisherSlice {}
