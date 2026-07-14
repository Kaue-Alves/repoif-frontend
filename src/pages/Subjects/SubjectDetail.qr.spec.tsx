import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { UserRole } from '../../contexts/AuthContext'
import { AuthProvider } from '../../contexts/AuthContext'
import { ToastProvider } from '../../contexts/ToastContext'
import SubjectDetail from './SubjectDetail'
import type { FileRecord, SubjectWithTeacher } from './subjects.service'

const PROFESSOR_ID = 'teacher-1'
const SUBJECT_ID = 'subject-1'

const disciplina: SubjectWithTeacher = {
  id: SUBJECT_ID,
  name: 'Algoritmos',
  description: 'Disciplina de teste',
  teacherId: PROFESSOR_ID,
  teacherUsername: 'ana',
} as SubjectWithTeacher

/** Público de propósito: é o único caso em que o aluno chegava a ver o botão de QR. */
const arquivoPublico: FileRecord = {
  id: 'file-1',
  originalName: 'aula-01.pdf',
  key: 'k1',
  mimeType: 'application/pdf',
  size: 1024,
  subjectId: SUBJECT_ID,
  uploadedBy: PROFESSOR_ID,
  isPublic: true,
  createdAt: '2026-07-01T12:00:00.000Z',
  updatedAt: '2026-07-01T12:00:00.000Z',
}

vi.mock('./subjects.service', async (importarOriginal) => {
  const original = await importarOriginal<typeof import('./subjects.service')>()
  return {
    ...original,
    getSubject: vi.fn(),
    getSubjectFiles: vi.fn(),
    getDownloadUrl: vi.fn().mockResolvedValue('https://r2.example/presigned'),
  }
})

const { getSubject, getSubjectFiles } = await import('./subjects.service')

const b64url = (o: object) =>
  btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/** O cliente decodifica o JWT sem verificar a assinatura, então um token forjado serve. */
function autenticarComo(role: UserRole, sub: string, username: string) {
  const exp = Math.floor(Date.now() / 1000) + 3600
  localStorage.setItem(
    'repoif_token',
    `${b64url({ alg: 'HS256' })}.${b64url({ sub, username, role, exp })}.assinatura`
  )
  localStorage.setItem('repoif_expiry', String(exp * 1000))
}

function renderizar() {
  return render(
    <MemoryRouter initialEntries={[`/subjects/${SUBJECT_ID}`]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/subjects/:id" element={<SubjectDetail />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

const botaoQr = () => screen.queryByTitle('Compartilhar via QR code')

describe('SubjectDetail — quem pode compartilhar por QR code', () => {
  beforeEach(() => {
    vi.mocked(getSubject).mockResolvedValue(disciplina)
    vi.mocked(getSubjectFiles).mockResolvedValue([arquivoPublico])
  })

  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  /**
   * O QR embute uma URL pré-assinada do R2, que dispensa login e turma. Oferecê-lo ao
   * aluno é dar um botão de "republicar material de aula fora da turma".
   */
  it('o aluno não vê o botão de QR, nem em arquivo público', async () => {
    autenticarComo('STUDENT', 'student-1', 'bruno')
    renderizar()

    expect(await screen.findByText('aula-01.pdf')).toBeInTheDocument()
    expect(botaoQr()).not.toBeInTheDocument()
  })

  it('o professor dono continua vendo o botão de QR', async () => {
    autenticarComo('TEACHER', PROFESSOR_ID, 'ana')
    renderizar()

    expect(await screen.findByText('aula-01.pdf')).toBeInTheDocument()
    await waitFor(() => expect(botaoQr()).toBeInTheDocument())
  })

  it('o visitante não autenticado também não vê o botão de QR', async () => {
    renderizar()

    expect(await screen.findByText('aula-01.pdf')).toBeInTheDocument()
    expect(botaoQr()).not.toBeInTheDocument()
  })

  /** O aluno segue podendo baixar — o que se retirou foi só a republicação por QR. */
  it('o aluno mantém o botão de baixar', async () => {
    autenticarComo('STUDENT', 'student-1', 'bruno')
    renderizar()

    expect(await screen.findByText('aula-01.pdf')).toBeInTheDocument()
    expect(screen.getByTitle('Baixar arquivo')).toBeInTheDocument()
  })
})
