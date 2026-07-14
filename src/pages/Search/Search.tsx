import AppLayout from '../../components/layouts/AppLayout'
import TeacherDirectory from '../../components/TeacherDirectory'
import { useAuth, type UserRole } from '../../contexts/AuthContext'

// Exaustivo por papel: o aluno só enxerga professores das turmas em que está,
// então prometer "explore os professores cadastrados" seria mentira para ele.
const HEADINGS: Record<UserRole, { title: string; subtitle: string }> = {
  STUDENT: {
    title: 'Seus professores',
    subtitle: 'Professores das turmas em que você participa. Acesse suas disciplinas e materiais.',
  },
  TEACHER: {
    title: 'Conheça nossos professores',
    subtitle: 'Explore os professores cadastrados e acesse suas disciplinas públicas.',
  },
  ADMIN: {
    title: 'Professores cadastrados',
    subtitle: 'Consulte os professores da plataforma e suas disciplinas públicas.',
  },
}

const ANONYMOUS = HEADINGS.TEACHER

export default function Search() {
  const { user } = useAuth()
  const { title, subtitle } = user ? HEADINGS[user.role] : ANONYMOUS

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-xl">
        <div className="text-center space-y-sm">
          <h1 className="text-headline-lg text-on-surface">{title}</h1>
          <p className="text-body-md text-on-surface-variant">{subtitle}</p>
        </div>

        <TeacherDirectory />
      </div>
    </AppLayout>
  )
}
