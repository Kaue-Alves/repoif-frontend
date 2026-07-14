import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import FileDropZone from './FileDropZone'

const arquivo = (nome: string) => new File(['conteudo'], nome, { type: 'application/octet-stream' })

/** `DataTransfer` do jsdom não guarda arquivos; o handler só lê `dataTransfer.files`. */
const soltar = (zona: HTMLElement, ...arquivos: File[]) =>
  fireEvent.drop(zona, { dataTransfer: { files: arquivos } })

function montar() {
  const onFile = vi.fn()
  const onReject = vi.fn()
  render(<FileDropZone onFile={onFile} onReject={onReject} label="Arraste um arquivo" />)
  return { onFile, onReject, zona: screen.getByRole('button', { name: /arraste um arquivo/i }) }
}

describe('FileDropZone', () => {
  it('aceita um arquivo permitido solto na área', () => {
    const { onFile, onReject, zona } = montar()

    soltar(zona, arquivo('aula.pdf'))

    expect(onFile).toHaveBeenCalledTimes(1)
    expect(onFile.mock.calls[0][0].name).toBe('aula.pdf')
    expect(onReject).not.toHaveBeenCalled()
  })

  it('recusa um executável solto na área, sem chamar onFile', () => {
    const { onFile, onReject, zona } = montar()

    soltar(zona, arquivo('virus.exe'))

    expect(onFile).not.toHaveBeenCalled()
    expect(onReject).toHaveBeenCalledTimes(1)
    expect(onReject.mock.calls[0][0]).toContain('.exe')
  })

  it('recusa dupla extensão: trabalho.pdf.exe é um .exe', () => {
    const { onFile, onReject, zona } = montar()

    soltar(zona, arquivo('trabalho.pdf.exe'))

    expect(onFile).not.toHaveBeenCalled()
    expect(onReject).toHaveBeenCalled()
  })

  it('recusa arquivo acima de 200 MB, informando o limite', () => {
    const grande = new File(['x'], 'video.mp4')
    Object.defineProperty(grande, 'size', { value: 201 * 1024 * 1024 })
    const { onFile, onReject, zona } = montar()

    soltar(zona, grande)

    expect(onFile).not.toHaveBeenCalled()
    expect(onReject.mock.calls[0][0]).toContain('200 MB')
  })

  it('aceita o mesmo arquivo escolhido pelo seletor, não só pelo arraste', async () => {
    const onFile = vi.fn()
    const { container } = render(<FileDropZone onFile={onFile} label="Arraste um arquivo" />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    await userEvent.upload(input, arquivo('aula.pdf'))

    expect(onFile).toHaveBeenCalledTimes(1)
  })

  it('bloqueia o executável também pelo seletor', async () => {
    const onFile = vi.fn()
    const onReject = vi.fn()
    const { container } = render(<FileDropZone onFile={onFile} onReject={onReject} label="Arraste um arquivo" />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    await userEvent.upload(input, arquivo('setup.msi'))

    expect(onFile).not.toHaveBeenCalled()
    expect(onReject).toHaveBeenCalled()
  })

  it('destaca a área enquanto o arquivo paira e desfaz ao sair', () => {
    const { zona } = montar()

    fireEvent.dragEnter(zona, { dataTransfer: { files: [] } })
    expect(screen.getByText('Solte o arquivo aqui')).toBeInTheDocument()

    fireEvent.dragLeave(zona)
    expect(screen.queryByText('Solte o arquivo aqui')).not.toBeInTheDocument()
    expect(screen.getByText('Arraste um arquivo')).toBeInTheDocument()
  })

  /**
   * `dragleave` dispara ao cruzar elementos filhos. Sem o contador de profundidade,
   * o destaque piscaria enquanto o cursor se move dentro da zona.
   */
  it('mantém o destaque ao cruzar elementos filhos (dragenter aninhado)', () => {
    const { zona } = montar()

    fireEvent.dragEnter(zona, { dataTransfer: { files: [] } }) // entra na zona
    fireEvent.dragEnter(zona, { dataTransfer: { files: [] } }) // entra num filho
    fireEvent.dragLeave(zona) // sai do filho, ainda dentro da zona

    expect(screen.getByText('Solte o arquivo aqui')).toBeInTheDocument()

    fireEvent.dragLeave(zona) // agora sai da zona de fato
    expect(screen.queryByText('Solte o arquivo aqui')).not.toBeInTheDocument()
  })

  it('desabilitada, ignora o arquivo solto', () => {
    const onFile = vi.fn()
    const onReject = vi.fn()
    render(<FileDropZone onFile={onFile} onReject={onReject} label="Arraste um arquivo" disabled />)

    soltar(screen.getByRole('button', { name: /arraste um arquivo/i }), arquivo('aula.pdf'))

    expect(onFile).not.toHaveBeenCalled()
    expect(onReject).not.toHaveBeenCalled()
  })
})
