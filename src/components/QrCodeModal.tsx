import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Spinner from './Spinner'

interface QrCodeModalProps {
  open: boolean
  fileName: string
  url: string | null
  loading?: boolean
  error?: string
  onClose: () => void
}

export default function QrCodeModal({
  open,
  fileName,
  url,
  loading = false,
  error,
  onClose,
}: QrCodeModalProps) {
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !open) return
      if (fullscreen) setFullscreen(false)
      else onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, fullscreen, onClose])

  // Sai do modo tela cheia sempre que o modal fecha
  useEffect(() => {
    if (!open) setFullscreen(false)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-xl shadow-xl p-lg flex flex-col gap-md">
        <div className="flex items-start gap-md">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high">
            <span
              className="material-symbols-outlined text-on-surface-variant"
              style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
            >
              qr_code_2
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 id="qr-modal-title" className="text-headline-sm text-on-surface">
              QR Code do arquivo
            </h2>
            <p className="text-body-md text-on-surface-variant mt-xs truncate">{fileName}</p>
          </div>

          {url && !loading && !error && (
            <button
              onClick={() => setFullscreen(true)}
              title="Tela cheia"
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>fullscreen</span>
            </button>
          )}

          <button
            onClick={onClose}
            title="Fechar"
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center gap-md py-md min-h-[15rem]">
          {loading && <Spinner className="h-8 w-8 text-primary" />}

          {!loading && error && (
            <p className="text-body-md text-error text-center">{error}</p>
          )}

          {!loading && !error && url && (
            <>
              <button
                onClick={() => setFullscreen(true)}
                title="Ampliar para tela cheia"
                className="bg-white p-md rounded-xl hover:opacity-90 transition-all"
              >
                <QRCodeSVG value={url} size={192} level="M" />
              </button>
              <p className="text-label-sm text-on-surface-variant text-center">
                Escaneie com a câmera para abrir o arquivo.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Tela cheia */}
      {fullscreen && url && (
        <div
          className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center gap-lg p-lg"
          onClick={() => setFullscreen(false)}
        >
          <QRCodeSVG
            value={url}
            level="M"
            className="w-full h-auto max-w-[min(90vw,90vh)]"
          />
          <p className="text-body-md text-on-surface-variant text-center max-w-md truncate">
            {fileName}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); setFullscreen(false) }}
            title="Sair da tela cheia"
            className="absolute top-md right-md w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>fullscreen_exit</span>
          </button>
        </div>
      )}
    </div>
  )
}
