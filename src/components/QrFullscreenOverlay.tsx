import { useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QrFullscreenOverlayProps {
  url: string
  /** Legenda sob o QR: nome do arquivo, nome da turma… */
  caption: string
  onClose: () => void
}

/**
 * QR ampliado sobre fundo branco, para ser escaneado de longe — do fundo da sala,
 * projetado. Fica em `fixed` para cobrir a página inteira, e não só o container.
 */
export default function QrFullscreenOverlay({ url, caption, onClose }: QrFullscreenOverlayProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center gap-lg p-lg cursor-zoom-out"
      role="dialog"
      aria-modal="true"
      aria-label="QR code em tela cheia"
      onClick={onClose}
    >
      <QRCodeSVG value={url} level="M" className="w-full h-auto max-w-[min(90vw,80vh)]" />
      <p className="text-body-lg text-on-surface-variant text-center max-w-md truncate">{caption}</p>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        title="Sair da tela cheia (Esc)"
        className="absolute top-md right-md w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all"
      >
        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 24 }}>fullscreen_exit</span>
      </button>
    </div>
  )
}
