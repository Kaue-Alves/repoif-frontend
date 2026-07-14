import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import Field from './Field'

describe('Field', () => {
  /**
   * O ponto do componente. Um `<label>` apenas visual (sem `htmlFor`) deixa o campo
   * anônimo para o leitor de tela — era o estado das seis cópias que ele substituiu.
   * `getByLabelText` só encontra o campo se a ligação existir de fato.
   */
  it('liga o rótulo ao campo, tornando-o acessível pelo nome', () => {
    render(<Field label="Senha">{(id) => <input id={id} type="password" />}</Field>)

    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  /** Consequência prática da ligação: clicar no rótulo foca o campo. */
  it('clicar no rótulo foca o campo', async () => {
    render(<Field label="E-mail">{(id) => <input id={id} type="email" />}</Field>)

    await userEvent.click(screen.getByText('E-mail'))

    expect(screen.getByLabelText('E-mail')).toHaveFocus()
  })

  /** Dois Fields na mesma tela não podem colidir de id — `useId` garante isso. */
  it('gera ids distintos para campos diferentes', () => {
    render(
      <>
        <Field label="Nome">{(id) => <input id={id} />}</Field>
        <Field label="Descrição">{(id) => <input id={id} />}</Field>
      </>
    )

    const nome = screen.getByLabelText('Nome')
    const descricao = screen.getByLabelText('Descrição')

    expect(nome.id).not.toBe(descricao.id)
    expect(nome).not.toBe(descricao)
  })

  it('mostra o asterisco de obrigatório e a nota do rótulo', () => {
    render(
      <Field label="Descrição" hint="Opcional" required>
        {(id) => <textarea id={id} />}
      </Field>
    )

    expect(screen.getByLabelText(/Descrição/)).toBeInTheDocument()
    expect(screen.getByText('(Opcional)')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
  })
})
