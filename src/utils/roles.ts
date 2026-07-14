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

/**
 * Quem pode compartilhar um arquivo por QR code.
 *
 * O QR embute uma URL pré-assinada do R2, que **não** passa pela autorização de
 * download: quem recebe o código baixa o arquivo sem estar logado nem pertencer à
 * turma. Isso é intencional para o professor divulgar um material, e é justamente
 * por isso que o aluno não pode fazê-lo — seria uma porta para republicar material
 * de aula fora da turma.
 */
export const CAN_SHARE_FILE_QR: Record<UserRole, boolean> = {
  ADMIN: true,
  TEACHER: true,
  STUDENT: false,
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
