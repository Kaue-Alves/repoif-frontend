import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { UserRole } from '../../contexts/AuthContext'
import { AuthProvider } from '../../contexts/AuthContext'
import { ToastProvider } from '../../contexts/ToastContext'
import Search from './Search'

// O diretório faz o próprio fetch; aqui interessa o cabeçalho, não a lista.
vi.mock('./search.service', () => ({
  listTeachers: vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, limit: 12, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  }),
}))

const b64url = (o: object) =>
  btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/** O cliente decodifica o JWT sem verificar a assinatura, então um token forjado serve. */
function autenticarComo(role: UserRole, username = 'usuario') {
  const exp = Math.floor(Date.now() / 1000) + 3600
  localStorage.setItem('repoif_token', `${b64url({ alg: 'HS256' })}.${b64url({ sub: 'u-1', username, role, exp })}.assinatura`)
  localStorage.setItem('repoif_expiry', String(exp * 1000))
}

function renderizar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>
          <Search />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Tela de professores, por papel', () => {
  /**
   * O aluno só enxerga professores das turmas em que participa. Prometer a ele
   * "explore os professores cadastrados" era a mentira do item P19.
   */
  it('o aluno lê que vê apenas os professores das suas turmas', () => {
    autenticarComo('STUDENT', 'joao')
    renderizar()

    expect(screen.getByRole('heading', { name: 'Seus professores' })).toBeInTheDocument()
    expect(screen.getByText(/professores das turmas em que você participa/i)).toBeInTheDocument()
    expect(screen.queryByText(/explore os professores cadastrados/i)).not.toBeInTheDocument()
  })

  it('o professor lê o convite a explorar o diretório', () => {
    autenticarComo('TEACHER', 'ana')
    renderizar()

    expect(screen.getByRole('heading', { name: 'Conheça nossos professores' })).toBeInTheDocument()
    expect(screen.getByText(/explore os professores cadastrados/i)).toBeInTheDocument()
  })

  it('o admin lê uma variante de consulta, não de exploração', () => {
    autenticarComo('ADMIN', 'raiz')
    renderizar()

    expect(screen.getByRole('heading', { name: 'Professores cadastrados' })).toBeInTheDocument()
    expect(screen.getByText(/consulte os professores/i)).toBeInTheDocument()
  })

  it('sem sessão, cai no texto público', () => {
    renderizar()
    expect(screen.getByRole('heading', { name: 'Conheça nossos professores' })).toBeInTheDocument()
  })

  it('nenhum papel vê o texto de outro papel', () => {
    autenticarComo('ADMIN', 'raiz')
    renderizar()

    expect(screen.queryByText(/professores das turmas em que você participa/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/explore os professores cadastrados/i)).not.toBeInTheDocument()
  })
})
