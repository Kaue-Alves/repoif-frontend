import { describe, expect, it } from 'vitest'
import {
  blockedFileMessage,
  fileExtension,
  isBlockedFile,
  isTooLarge,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  rejectionReason,
} from './uploadPolicy'

const MB = 1024 * 1024
const arquivo = (nome: string, size: number) => {
  const f = new File(['x'], nome)
  Object.defineProperty(f, 'size', { value: size })
  return f
}

describe('fileExtension()', () => {
  it.each([
    ['aula.pdf', 'pdf'],
    ['AULA.PDF', 'pdf'],
    ['trabalho.pdf.exe', 'exe'],
    ['payload.exe ', 'exe'],
    ['payload.exe.', 'exe'],
    ['sem-extensao', ''],
    ['.gitignore', ''],
  ])('%s -> "%s"', (nome, esperado) => {
    expect(fileExtension(nome)).toBe(esperado)
  })
})

describe('isBlockedFile()', () => {
  it.each(['virus.exe', 'setup.msi', 'run.bat', 'script.ps1', 'app.apk', 'lib.dll'])(
    'bloqueia %s',
    nome => expect(isBlockedFile(nome)).toBe(true),
  )

  /** Curso de desenvolvimento de sistemas: compartilhar código é caso de uso legítimo. */
  it.each(['codigo.js', 'script.py', 'build.sh', 'lib.jar', 'aula.pdf', 'README'])(
    'permite %s',
    nome => expect(isBlockedFile(nome)).toBe(false),
  )

  it('só a última extensão conta', () => {
    expect(isBlockedFile('trabalho.pdf.exe')).toBe(true)
    expect(isBlockedFile('arquivo.exe.pdf')).toBe(false)
  })
})

describe('blockedFileMessage()', () => {
  it('nomeia a extensão recusada', () => {
    expect(blockedFileMessage('virus.exe')).toContain('.exe')
    expect(blockedFileMessage('setup.msi')).toContain('.msi')
  })
})

describe('isTooLarge()', () => {
  it('o limite é 200 MB', () => {
    expect(MAX_UPLOAD_BYTES).toBe(200 * MB)
    expect(MAX_UPLOAD_LABEL).toBe('200 MB')
  })

  it('aceita exatamente 200 MB e recusa um byte acima', () => {
    expect(isTooLarge(MAX_UPLOAD_BYTES)).toBe(false)
    expect(isTooLarge(MAX_UPLOAD_BYTES + 1)).toBe(true)
  })
})

describe('rejectionReason()', () => {
  it('arquivo válido não tem motivo de recusa', () => {
    expect(rejectionReason(arquivo('aula.pdf', 10 * MB))).toBeNull()
  })

  it('extensão bloqueada é recusada mesmo com tamanho ok', () => {
    expect(rejectionReason(arquivo('virus.exe', 1))).toContain('.exe')
  })

  it('arquivo grande demais é recusado com a mensagem de tamanho', () => {
    const reason = rejectionReason(arquivo('video.mp4', 201 * MB))
    expect(reason).toContain('200 MB')
    expect(reason).toContain('excede')
  })

  /** A extensão é checada antes do tamanho: um .exe gigante fala do .exe, não do tamanho. */
  it('extensão tem prioridade sobre tamanho', () => {
    expect(rejectionReason(arquivo('malware.exe', 500 * MB))).toContain('.exe')
  })
})
