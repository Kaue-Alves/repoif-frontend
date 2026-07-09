import type { AuthUser, UserRole } from '../contexts/AuthContext'

/**
 * Fonte única de rótulos, ícones e rotas por papel. Os `Record<UserRole, …>` são
 * exaustivos por construção: adicionar um papel novo ao enum quebra a compilação aqui.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  TEACHER: 'Professor',
  STUDENT: 'Aluno',
}

export const ROLE_ICONS: Record<UserRole, string> = {
  ADMIN: 'admin_panel_settings',
  TEACHER: 'school',
  STUDENT: 'person',
}

export const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  ADMIN: 'bg-secondary-container/40 text-secondary',
  TEACHER: 'bg-primary-container/30 text-primary',
  STUDENT: 'bg-tertiary-fixed/30 text-tertiary',
}

/** Página inicial de cada papel. Login, RootRedirect e guards usam esta única regra. */
export function homePathFor(user: Pick<AuthUser, 'role' | 'username'> | null): string {
  if (!user) return '/login'
  switch (user.role) {
    case 'ADMIN':
      return '/admin'
    case 'TEACHER':
      return '/dashboard'
    case 'STUDENT':
      return `/profile/${user.username}`
  }
}
