import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ResendVerification from './ResendVerification'
import { resendVerification } from './resendVerification.service'

vi.mock('./resendVerification.service', () => ({
  resendVerification: vi.fn().mockResolvedValue(undefined),
}))

const mockado = vi.mocked(resendVerification)

function renderizar() {
  return render(
    <MemoryRouter>
      <ResendVerification />
    </MemoryRouter>
  )
}

describe('ResendVerification', () => {
  beforeEach(() => {
    mockado.mockClear()
    mockado.mockResolvedValue(undefined)
  })

  it('envia o e-mail informado e confirma o envio', async () => {
    renderizar()

    await userEvent.type(screen.getByLabelText('E-mail'), 'bruno@aluno.ifpi.edu.br')
    await userEvent.click(screen.getByRole('button', { name: /reenviar/i }))

    expect(mockado).toHaveBeenCalledWith('bruno@aluno.ifpi.edu.br')
    expect(await screen.findByText(/verifique sua caixa de entrada/i)).toBeInTheDocument()
  })

  /**
   * A confirmação é deliberadamente vaga ("se o e-mail tiver uma conta…"): afirmar que
   * o envio ocorreu revelaria quais e-mails têm cadastro. O texto tem de acompanhar
   * o comportamento silencioso do backend.
   */
  it('a confirmação não revela se a conta existe', async () => {
    renderizar()

    await userEvent.type(screen.getByLabelText('E-mail'), 'ninguem@example.com')
    await userEvent.click(screen.getByRole('button', { name: /reenviar/i }))

    expect(await screen.findByText(/tiver uma conta ainda\s+não verificada/i)).toBeInTheDocument()
  })

  it('mostra a falha sem alegar que enviou', async () => {
    mockado.mockRejectedValue(new Error('Muitas tentativas em pouco tempo.'))
    renderizar()

    await userEvent.type(screen.getByLabelText('E-mail'), 'bruno@aluno.ifpi.edu.br')
    await userEvent.click(screen.getByRole('button', { name: /reenviar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas em pouco tempo.')
    expect(screen.queryByText(/verifique sua caixa de entrada/i)).not.toBeInTheDocument()
  })
})
