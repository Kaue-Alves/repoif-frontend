import { useRef, useState } from 'react'
import { rejectionReason } from '../utils/uploadPolicy'

interface FileDropZoneProps {
  /** Recebe o arquivo escolhido — por clique ou por arraste. */
  onFile: (file: File) => void
  /** Chamado quando o arquivo é recusado pela política de upload. */
  onReject?: (message: string) => void
  label: string
  /** Texto menor abaixo do label. */
  hint?: string
  icon?: string
  disabled?: boolean
  /** `compact` para caber em formulários (ex.: anexo de trabalho). */
  size?: 'default' | 'compact'
}

/**
 * Área de upload: clique para escolher ou arraste o arquivo por cima.
 *
 * O contador de `dragDepth` existe porque `dragleave` dispara ao passar por cima
 * dos elementos filhos; sem ele o destaque pisca enquanto o cursor se move dentro
 * da zona.
 */
export default function FileDropZone({
  onFile,
  onReject,
  label,
  hint,
  icon = 'cloud_upload',
  disabled = false,
  size = 'default',
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const dragDepth = useRef(0)

  function accept(file: File | undefined) {
    if (!file) return
    const reason = rejectionReason(file)
    if (reason) {
      onReject?.(reason)
      return
    }
    onFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    if (disabled) return
    accept(e.dataTransfer.files?.[0])
  }

  const compact = size === 'compact'

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault()
          if (disabled) return
          dragDepth.current += 1
          setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault()
          dragDepth.current -= 1
          if (dragDepth.current <= 0) setDragging(false)
        }}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-xl text-center transition-all group disabled:opacity-60 ${
          compact ? 'py-md' : 'py-xl'
        } ${
          dragging
            ? 'border-primary bg-primary-container/20'
            : 'border-outline-variant hover:border-primary hover:bg-primary-container/5'
        }`}
      >
        <span
          className={`material-symbols-outlined transition-colors ${
            dragging ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'
          }`}
          style={{ fontSize: compact ? 20 : 40 }}
        >
          {dragging ? 'file_download' : icon}
        </span>
        <p
          className={`text-body-md mt-sm transition-colors ${
            dragging ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'
          }`}
        >
          {dragging ? 'Solte o arquivo aqui' : label}
        </p>
        {hint && !dragging && (
          <p className="text-label-sm text-on-surface-variant mt-xs">{hint}</p>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          accept(file)
        }}
      />
    </>
  )
}
