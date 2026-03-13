import type { FileError, FileRejection } from 'react-dropzone'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import supabase from '@/lib/supabase/client'

interface FileWithPreview extends File {
  preview?: string
  errors: readonly FileError[]
}

interface UseSupabaseUploadOptions {
  /**
   * Supabase Storage 中用于上传文件的 bucket 名称。
   */
  bucketName: string
  /**
   * 上传到指定 bucket 后的目标目录。
   *
   * 未提供时会直接上传到 bucket 根目录。
   *
   * 例如传入 `test` 时，文件会被上传为 `test/file_name`。
   */
  path?: string
  /**
   * 允许上传的 MIME 类型列表，例如 `image/png`、`text/html`。
   * 也支持通配写法，例如 `image/*`。
   *
   * 默认为不限制类型。
   */
  allowedMimeTypes?: string[]
  /**
   * 单个文件允许上传的最大体积，单位字节。
   */
  maxFileSize?: number
  /**
   * 单次选择允许上传的最大文件数。
   */
  maxFiles?: number
  /**
   * 文件在浏览器和 Supabase CDN 中的缓存时长，单位秒。
   *
   * 实际会写入 `Cache-Control: max-age=<seconds>` 头。
   * 默认值为 `3600` 秒。
   */
  cacheControl?: number
  /**
   * 是否允许覆盖同名文件。
   *
   * 设为 `true` 时，目标对象已存在会被覆盖；
   * 设为 `false` 时，已存在会抛出错误。默认值为 `false`。
   */
  upsert?: boolean
}

type UseSupabaseUploadReturn = ReturnType<typeof useSupabaseUpload>

function createPreviewFile(
  file: File,
  errors: readonly FileError[] = [],
): FileWithPreview {
  return Object.assign(file, {
    preview: URL.createObjectURL(file),
    errors,
  }) as FileWithPreview
}

function revokePreview(file: FileWithPreview) {
  if (file.preview) {
    URL.revokeObjectURL(file.preview)
  }
}

/**
 * 封装基于 Supabase Storage 的文件拖拽上传流程。
 *
 * Hook 集成了 `react-dropzone` 的拖拽接收能力，并维护上传过程中常见的状态：
 * - 当前待上传文件列表
 * - 每个文件的本地预览地址与校验错误
 * - 上传中状态
 * - 成功与失败结果
 *
 * 调用 `onUpload` 时，Hook 会把文件上传到指定 bucket/path；
 * 如果之前存在失败文件，再次点击上传时会优先重试失败项，
 * 从而支持“部分成功后继续补传”的工作流。
 *
 * 注意：该 Hook 只处理前端选择、校验和上传状态，不负责业务层面的文件记录落库。
 *
 * @param options 上传配置
 * @param options.bucketName Supabase Storage 中的 bucket 名称
 * @param options.path 上传目录；省略时直接上传到 bucket 根目录
 * @param options.allowedMimeTypes 允许上传的 MIME 类型列表
 * @param options.maxFileSize 单个文件允许的最大体积，单位字节
 * @param options.maxFiles 单次允许选择的最大文件数
 * @param options.cacheControl 上传对象的缓存时间，单位秒
 * @param options.upsert 是否允许覆盖同名文件
 * @returns 上传状态、文件列表、错误信息、成功结果、上传方法以及 dropzone 所需属性
 */
function useSupabaseUpload(options: UseSupabaseUploadOptions) {
  const {
    bucketName,
    path,
    allowedMimeTypes = [],
    maxFileSize = Number.POSITIVE_INFINITY,
    maxFiles = 1,
    cacheControl = 3600,
    upsert = false,
  } = options

  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<{ name: string, message: string }[]>([])
  const [successes, setSuccesses] = useState<string[]>([])
  const previousFilesRef = useRef<FileWithPreview[]>([])

  const isSuccess = useMemo(() => {
    if (errors.length === 0 && successes.length === 0) {
      return false
    }
    if (errors.length === 0 && successes.length === files.length) {
      return true
    }
    return false
  }, [errors.length, successes.length, files.length])

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setFiles((previousFiles) => {
        const existingFileNames = new Set(
          previousFiles.map(file => file.name),
        )

        const validFiles = acceptedFiles
          .filter(file => !existingFileNames.has(file.name))
          .map(file => createPreviewFile(file))

        const invalidFiles = fileRejections.map(({ file, errors }) => {
          return createPreviewFile(file, errors)
        })

        return [...previousFiles, ...validFiles, ...invalidFiles]
      })
    },
    [],
  )

  useEffect(() => {
    const activePreviewUrls = new Set(
      files.map(file => file.preview).filter(Boolean),
    )

    previousFilesRef.current.forEach((file) => {
      if (file.preview && !activePreviewUrls.has(file.preview)) {
        revokePreview(file)
      }
    })

    previousFilesRef.current = files
  }, [files])

  useEffect(
    () => () => {
      previousFilesRef.current.forEach(revokePreview)
    },
    [],
  )

  const accept = useMemo(
    () =>
      allowedMimeTypes.reduce<Record<string, []>>((accumulator, mimeType) => {
        accumulator[mimeType] = []
        return accumulator
      }, {}),
    [allowedMimeTypes],
  )

  const dropzoneProps = useDropzone({
    onDrop,
    noClick: true,
    accept,
    maxSize: maxFileSize,
    maxFiles,
    multiple: maxFiles !== 1,
  })

  const onUpload = useCallback(async () => {
    setLoading(true)

    try {
      const filesWithErrors = new Set(errors.map(fileError => fileError.name))
      const uploadedFileNames = new Set(successes)
      const filesToUpload
        = filesWithErrors.size > 0
          ? files.filter(
              file =>
                filesWithErrors.has(file.name)
                || !uploadedFileNames.has(file.name),
            )
          : files

      const uploadResults = await Promise.all(
        filesToUpload.map(async (file) => {
          try {
            const { error } = await supabase.storage
              .from(bucketName)
              .upload(path ? `${path}/${file.name}` : file.name, file, {
                cacheControl: cacheControl.toString(),
                upsert,
              })

            return error
              ? { name: file.name, message: error.message }
              : { name: file.name, message: undefined }
          }
          catch (error) {
            return {
              name: file.name,
              message: error instanceof Error ? error.message : '上传失败',
            }
          }
        }),
      )

      const uploadErrors = uploadResults.filter(
        (result): result is { name: string, message: string } =>
          result.message !== undefined,
      )
      const uploadedSuccesses = uploadResults
        .filter(result => result.message === undefined)
        .map(result => result.name)

      setErrors(uploadErrors)
      setSuccesses(previousSuccesses =>
        Array.from(new Set([...previousSuccesses, ...uploadedSuccesses])),
      )
    }
    finally {
      setLoading(false)
    }
  }, [files, path, bucketName, errors, successes, upsert, cacheControl])

  useEffect(() => {
    if (files.length === 0) {
      setErrors([])
      setSuccesses([])
      return
    }

    if (files.length <= maxFiles) {
      let changed = false
      const nextFiles = files.map((file) => {
        if (file.errors.some(error => error.code === 'too-many-files')) {
          file.errors = file.errors.filter(
            error => error.code !== 'too-many-files',
          )
          changed = true
        }
        return file
      })

      if (changed) {
        setFiles(nextFiles)
      }
    }
  }, [files, maxFiles])

  useEffect(() => {
    const activeFileNames = new Set(files.map(file => file.name))

    setErrors(previousErrors =>
      previousErrors.filter(error => activeFileNames.has(error.name)),
    )
    setSuccesses(previousSuccesses =>
      previousSuccesses.filter(fileName => activeFileNames.has(fileName)),
    )
  }, [files])

  return {
    files,
    setFiles,
    successes,
    isSuccess,
    loading,
    errors,
    setErrors,
    onUpload,
    maxFileSize,
    maxFiles,
    allowedMimeTypes,
    ...dropzoneProps,
  }
}

export {
  useSupabaseUpload,
  type UseSupabaseUploadOptions,
  type UseSupabaseUploadReturn,
}
