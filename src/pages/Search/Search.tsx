import AppLayout from '../../components/layouts/AppLayout'
import TeacherDirectory from '../../components/TeacherDirectory'

export default function Search() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-xl">
        <div className="text-center space-y-sm">
          <h1 className="text-headline-lg text-on-surface">Conheça nossos professores</h1>
          <p className="text-body-md text-on-surface-variant">
            Explore os professores cadastrados e acesse suas disciplinas e materiais.
          </p>
        </div>

        <TeacherDirectory />
      </div>
    </AppLayout>
  )
}
