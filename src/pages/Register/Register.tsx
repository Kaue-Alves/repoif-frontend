import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/layouts/AuthLayout'
import Spinner from '../../components/Spinner'
import { registerUser, type Role } from './register.service'
import Field from '../../components/Field'

export default function Register() {
  const navigate = useNavigate()

  const [role, setRole] = useState<Role>('STUDENT')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    setError('')
    setLoading(true)

    try {
      await registerUser({ username: username.trim(), email: email.trim(), password, role })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout title="Cadastro realizado!">
        <div className="text-center space-y-lg">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto">
            <span aria-hidden="true"
              className="material-symbols-outlined text-on-primary-container"
              style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}
            >
              mark_email_read
            </span>
          </div>
          <div className="space-y-sm">
            <p className="text-body-lg text-on-surface font-medium">
              Verifique seu email!
            </p>
            <p className="text-body-md text-on-surface-variant">
              Enviamos um link de confirmação para{' '}
              <strong className="text-on-surface">{email}</strong>.
              <br />
              Você só poderá fazer login após confirmar o email.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-primary text-on-primary py-sm rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all"
          >
            Ir para o Login
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Escolha seu perfil e preencha os dados">
      <form onSubmit={handleSubmit} className="space-y-md">
        {/* Role selector */}
        <div>
          <label className="block text-label-lg text-on-surface mb-sm">Sou um(a)...</label>
          <div className="grid grid-cols-2 gap-md">
            {(['STUDENT', 'TEACHER'] as Role[]).map((r) => {
              const active = role === r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex flex-col items-center gap-sm p-md rounded-xl border-2 transition-all ${
                    active
                      ? 'border-primary bg-primary-container/20 text-primary'
                      : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary/50'
                  }`}
                >
                  <span aria-hidden="true"
                    className="material-symbols-outlined"
                    style={{ fontSize: 28, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {r === 'TEACHER' ? 'school' : 'person'}
                  </span>
                  <span className="text-label-lg font-semibold">
                    {r === 'TEACHER' ? 'Professor' : 'Aluno'}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-sm flex items-start gap-xs bg-surface-container rounded-lg px-md py-sm text-body-sm text-on-surface-variant">
            <span aria-hidden="true" className="material-symbols-outlined flex-shrink-0 mt-[1px]" style={{ fontSize: 16 }}>info</span>
            {role === 'STUDENT'
              ? 'Acesse conteúdos de professores e faça download dos arquivos disponibilizados.'
              : 'Crie disciplinas e publique arquivos para que alunos possam visualizar e baixar.'}
          </div>
        </div>

        <Field label="Username">
          {(id) => (
            <input id={id}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: joaosilva (3–144 caracteres)"
              minLength={3}
              maxLength={144}
              autoComplete="username"
              required
              className={inputClass}
            />
          )}
        </Field>

        <Field label="Email">
          {(id) => (
            <input id={id}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: joao@email.com"
              autoComplete="email"
              required
              className={inputClass}
            />
          )}
        </Field>

        <Field label="Senha">
          {(id) => (
            <>
              <div className="relative">
                <input
                  id={id}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  autoComplete="new-password"
                  required
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  tabIndex={-1}
                >
                  <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="text-label-sm text-secondary mt-xs">
                  {8 - password.length} caractere(s) faltando
                </p>
              )}
            </>
          )}
        </Field>

        {error && <ErrorBox message={error} />}

        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? (
            <span className="flex items-center justify-center gap-sm">
              <Spinner className="h-4 w-4" /> Cadastrando...
            </span>
          ) : (
            'Criar conta'
          )}
        </button>
      </form>

      <p className="mt-lg text-center text-body-md text-on-surface-variant">
        Já tem conta?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const inputClass =
  'w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all'

const primaryBtn =
  'w-full bg-primary text-on-primary py-sm rounded-lg text-label-lg font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed'


function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
      <span aria-hidden="true" className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
      {message}
    </div>
  )
}
