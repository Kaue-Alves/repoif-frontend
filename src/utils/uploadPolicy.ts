import { formatFileSize } from './format'

/**
 * Espelho da lista de `repoif-backend/src/common/validators/safe-filename.validator.ts`.
 * O backend é quem decide de verdade; aqui a checagem só evita que o usuário suba
 * 200 MB para receber um 400 no fim.
 *
 * Extensões de código-fonte (.js, .py, .sh, .jar…) são permitidas de propósito —
 * compartilhar código é caso de uso legítimo do curso.
 */
export const BLOCKED_FILE_EXTENSIONS = [
  'exe', 'msi', 'msp', 'msc', 'com', 'scr', 'pif', 'cpl', 'gadget',
  'bat', 'cmd', 'vbs', 'vbe', 'jse', 'wsf', 'wsh', 'ws',
  'ps1', 'psm1', 'hta', 'lnk', 'scf', 'reg',
  'dll', 'sys', 'drv',
  'apk', 'dmg', 'app', 'deb', 'rpm',
]

const BLOCKED = new Set(BLOCKED_FILE_EXTENSIONS)

/**
 * Última extensão do nome, em minúsculas. Espaços e pontos finais são removidos
 * antes porque o Windows os ignora ao resolver o executável.
 */
export function fileExtension(filename: string): string {
  const cleaned = filename.trim().replace(/[.\s]+$/, '')
  const dot = cleaned.lastIndexOf('.')
  if (dot <= 0) return ''
  return cleaned.slice(dot + 1).toLowerCase()
}

/** Só a última extensão importa: "trabalho.pdf.exe" é um .exe. */
export function isBlockedFile(filename: string): boolean {
  return BLOCKED.has(fileExtension(filename))
}

export function blockedFileMessage(filename: string): string {
  const ext = fileExtension(filename)
  return `Arquivos .${ext} não são permitidos: executáveis e instaladores são bloqueados por segurança.`
}

// ─── Tamanho máximo ───────────────────────────────────────────────────────────

/** Espelho de `MAX_UPLOAD_BYTES` do backend: 200 MB. */
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

export const MAX_UPLOAD_LABEL = '200 MB'

/** Texto padrão sob as áreas de upload. */
export const UPLOAD_HINT = `Máximo de ${MAX_UPLOAD_LABEL}. Executáveis e instaladores não são aceitos.`

export function isTooLarge(size: number): boolean {
  return size > MAX_UPLOAD_BYTES
}

export function tooLargeMessage(size: number): string {
  return `O arquivo tem ${formatFileSize(size)} e excede o limite de ${MAX_UPLOAD_LABEL}.`
}

/**
 * Motivo pelo qual o arquivo não pode ser enviado, ou `null` se ele passa.
 * O backend revalida — aqui a checagem só evita subir 200 MB para receber um 400.
 */
export function rejectionReason(file: File): string | null {
  if (isBlockedFile(file.name)) return blockedFileMessage(file.name)
  if (isTooLarge(file.size)) return tooLargeMessage(file.size)
  return null
}
