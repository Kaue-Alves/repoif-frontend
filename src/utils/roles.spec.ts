import { describe, expect, it } from 'vitest'
import type { UserRole } from '../contexts/AuthContext'
import { homePathFor, ROLE_BADGE_CLASSES, ROLE_ICONS, ROLE_LABELS } from './roles'

const PAPEIS: UserRole[] = ['ADMIN', 'TEACHER', 'STUDENT']

describe('homePathFor()', () => {
  it('leva o admin ao painel — nunca ao perfil de aluno', () => {
    expect(homePathFor({ role: 'ADMIN', username: 'raiz' })).toBe('/admin')
  })

  it('leva o professor ao dashboard de disciplinas', () => {
    expect(homePathFor({ role: 'TEACHER', username: 'ana' })).toBe('/dashboard')
  })

  it('leva o aluno ao próprio perfil', () => {
    expect(homePathFor({ role: 'STUDENT', username: 'joao' })).toBe('/profile/joao')
  })

  it('sem usuário, manda para o login', () => {
    expect(homePathFor(null)).toBe('/login')
  })

  /**
   * A regra 2 do CLAUDE.md: papel nunca é booleano. Um `role === 'TEACHER' ? … : …`
   * jogaria o admin no ramo do aluno — foi exatamente o bug P1.
   */
  it('cada papel tem um destino distinto', () => {
    const destinos = PAPEIS.map(role => homePathFor({ role, username: 'x' }))
    expect(new Set(destinos).size).toBe(PAPEIS.length)
  })
})

describe('mapas por papel', () => {
  it.each(PAPEIS)('%s tem rótulo, ícone e classes de badge', role => {
    expect(ROLE_LABELS[role]).toBeTruthy()
    expect(ROLE_ICONS[role]).toBeTruthy()
    expect(ROLE_BADGE_CLASSES[role]).toBeTruthy()
  })

  it('o admin não é rotulado como professor nem como aluno', () => {
    expect(ROLE_LABELS.ADMIN).toBe('Administrador')
    expect(ROLE_LABELS.ADMIN).not.toBe(ROLE_LABELS.TEACHER)
    expect(ROLE_LABELS.ADMIN).not.toBe(ROLE_LABELS.STUDENT)
  })
})
