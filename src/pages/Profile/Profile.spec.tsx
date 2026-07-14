import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { UserRole } from '../../contexts/AuthContext'
import { AuthProvider } from '../../contexts/AuthContext'
import { ToastProvider } from '../../contexts/ToastContext'
import Profile from './Profile'
import { changePassword, getUserProfile, updateProfile, type UserProfile } from './profile.service'

vi.mock('./profile.service', () => ({
  getUserProfile: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
}))

vi.mock('../../components/TeacherDirectory', () => ({ default: () => <div /> }))

const professor: UserProfile = {
  id: 'u-1',
  username: 'kaue',
  name: null,
  role: 'TEACHER',
  subjects: [],
  stats: { role: 'TEACHER', subjects: 3, classrooms: 2, materials: 14, assignments: 5 },
}

const b64url = (o: object) =>
  btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

function autenticarComo(role: UserRole, username: string) {
  const exp = Math.floor(Date.now() / 1000) + 3600
  localStorage.setItem(
    'repoif_token',
    `${b64url({ alg: 'HS256' })}.${b64url({ sub: 'u-1', username, role, exp })}.assinatura`
  )
  localStorage.setItem('repoif_expiry', String(exp * 1000))
}

function renderizar(username: string) {
  return render(
    <MemoryRouter initialEntries={[`/profile/${username}`]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/profile/:username" element={<Profile />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Profile', () => {
  beforeEach(() => {
    vi.mocked(getUserProfile).mockResolvedValue(professor)
    vi.mocked(updateProfile).mockImplementation(async (name) => ({ ...professor, name }))
    vi.mocked(changePassword).mockResolvedValue(undefined)
  })

  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('nome de exibição', () => {
    /** Sem nome preenchido o cabeçalho ficaria vazio, então o @username assume. */
    it('exibe o @username como título enquanto não há nome', async () => {
      autenticarComo('TEACHER', 'kaue')
      renderizar('kaue')

      expect(await screen.findByRole('heading', { name: '@kaue' })).toBeInTheDocument()
    })

    it('com nome preenchido, o nome vira o título e o @username desce', async () => {
      vi.mocked(getUserProfile).mockResolvedValue({ ...professor, name: 'Kauê Alves S.' })
      autenticarComo('TEACHER', 'kaue')
      renderizar('kaue')

      expect(await screen.findByRole('heading', { name: 'Kauê Alves S.' })).toBeInTheDocument()
      // O @username também aparece no cabeçalho do AppLayout; basta que exista no perfil.
      expect(screen.getAllByText('@kaue').length).toBeGreaterThan(0)
    })

    it('salva o nome e atualiza o cabeçalho sem recarregar', async () => {
      autenticarComo('TEACHER', 'kaue')
      renderizar('kaue')

      await userEvent.click(await screen.findByRole('button', { name: /editar perfil/i }))
      await userEvent.type(screen.getByLabelText(/nome de exibição/i), 'Kauê Alves S.')
      await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

      expect(updateProfile).toHaveBeenCalledWith('Kauê Alves S.')
      expect(await screen.findByRole('heading', { name: 'Kauê Alves S.' })).toBeInTheDocument()
    })
  })

  describe('alterar senha', () => {
    async function abrirFormulario() {
      autenticarComo('TEACHER', 'kaue')
      renderizar('kaue')
      await userEvent.click(await screen.findByRole('button', { name: /alterar senha/i }))
    }

    it('envia a senha atual junto com a nova', async () => {
      await abrirFormulario()

      await userEvent.type(screen.getByLabelText('Senha atual'), 'antiga-123')
      await userEvent.type(screen.getByLabelText('Nova senha'), 'nova-senha-456')
      await userEvent.type(screen.getByLabelText('Confirmar nova senha'), 'nova-senha-456')
      await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

      expect(changePassword).toHaveBeenCalledWith('antiga-123', 'nova-senha-456')
    })

    /** Erro de digitação não deve custar uma ida ao servidor nem trocar a senha errada. */
    it('não chama a API quando a confirmação não confere', async () => {
      await abrirFormulario()

      await userEvent.type(screen.getByLabelText('Senha atual'), 'antiga-123')
      await userEvent.type(screen.getByLabelText('Nova senha'), 'nova-senha-456')
      await userEvent.type(screen.getByLabelText('Confirmar nova senha'), 'nova-senha-999')
      await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

      expect(changePassword).not.toHaveBeenCalled()
      expect(await screen.findByRole('alert')).toHaveTextContent(/não confere/i)
    })

    it('mostra a recusa do servidor quando a senha atual está errada', async () => {
      vi.mocked(changePassword).mockRejectedValue(new Error('Senha atual incorreta.'))
      await abrirFormulario()

      await userEvent.type(screen.getByLabelText('Senha atual'), 'chute')
      await userEvent.type(screen.getByLabelText('Nova senha'), 'nova-senha-456')
      await userEvent.type(screen.getByLabelText('Confirmar nova senha'), 'nova-senha-456')
      await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Senha atual incorreta.')
    })
  })

  describe('contadores e escopo', () => {
    it('mostra os contadores do professor no próprio perfil', async () => {
      autenticarComo('TEACHER', 'kaue')
      renderizar('kaue')

      expect(await screen.findByText('14')).toBeInTheDocument()
      expect(screen.getByText('materiais')).toBeInTheDocument()
      expect(screen.getByText('trabalhos')).toBeInTheDocument()
    })

    it('mostra os contadores do aluno, incluindo trabalhos pendentes', async () => {
      vi.mocked(getUserProfile).mockResolvedValue({
        id: 'u-2',
        username: 'bruno',
        name: null,
        role: 'STUDENT',
        stats: { role: 'STUDENT', classrooms: 2, submissions: 7, pendingAssignments: 1 },
      })
      autenticarComo('STUDENT', 'bruno')
      renderizar('bruno')

      expect(await screen.findByText('7')).toBeInTheDocument()
      expect(screen.getByText('entregas')).toBeInTheDocument()
      expect(screen.getByText('trabalho pendente')).toBeInTheDocument()
    })

    /**
     * O perfil alheio não traz `stats` (o backend só o envia ao dono) e não pode
     * oferecer edição — os contadores de um professor não são da conta de quem visita.
     */
    it('no perfil de outra pessoa não há contadores nem botões de edição', async () => {
      vi.mocked(getUserProfile).mockResolvedValue({ ...professor, stats: undefined })
      autenticarComo('STUDENT', 'bruno')
      renderizar('kaue')

      expect(await screen.findByRole('heading', { name: '@kaue' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /editar perfil/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /alterar senha/i })).not.toBeInTheDocument()
      expect(screen.queryByText('materiais')).not.toBeInTheDocument()
    })
  })
})
