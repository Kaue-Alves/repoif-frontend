import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layouts/AppLayout'
import Spinner from '../../components/Spinner'
import { createSubject } from './subjects.service'
import Field from '../../components/Field'

export default function SubjectNew() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setLoading(true)

    try {
      await createSubject({ name: name.trim(), description: description.trim() || undefined, isPublic })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar disciplina.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-xs text-label-sm text-on-surface-variant mb-lg">
          <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          <span className="text-on-surface">Nova Disciplina</span>
        </nav>

        <h1 className="text-headline-lg text-on-surface mb-xl">Nova Disciplina</h1>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-lg">
            {/* Name */}
            <Field label="Nome da disciplina" required>
              {(id) => (
                <>
                  <input
                    id={id}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Algoritmos e Lógica de Programação"
                    maxLength={255}
                    required
                    className={inputClass}
                  />
                  <p className="text-label-sm text-on-surface-variant mt-xs">{name.length}/255 caracteres</p>
                </>
              )}
            </Field>

            {/* Description */}
            <Field label="Descrição" hint="Opcional">
              {(id) => (
                <textarea id={id}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva brevemente o conteúdo da disciplina..."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              )}
            </Field>

            {/* Visibility */}
            <div>
              <label className="block text-label-lg text-on-surface mb-sm">Visibilidade</label>
              <div className="grid grid-cols-2 gap-md">
                {[
                  {
                    value: false,
                    icon: 'lock',
                    label: 'Privada',
                    desc: 'Apenas você pode ver',
                  },
                  {
                    value: true,
                    icon: 'public',
                    label: 'Pública',
                    desc: 'Qualquer pessoa pode ver',
                  },
                ].map((opt) => {
                  const active = isPublic === opt.value
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setIsPublic(opt.value)}
                      className={`flex items-center gap-md p-md rounded-xl border-2 text-left transition-all ${
                        active
                          ? 'border-primary bg-primary-container/20 text-primary'
                          : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                      }`}
                    >
                      <span aria-hidden="true"
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 24,
                          fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        {opt.icon}
                      </span>
                      <div>
                        <p className="text-label-lg font-semibold">{opt.label}</p>
                        <p className="text-label-sm opacity-80">{opt.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
                <span aria-hidden="true" className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-md justify-end pt-md border-t border-outline-variant">
              <Link
                to="/dashboard"
                className="px-lg py-sm border border-outline-variant text-on-surface-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-all"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex items-center gap-sm px-lg py-sm bg-primary text-on-primary rounded-lg text-label-lg font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Criando...
                  </>
                ) : (
                  <>
                    <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                    Criar Disciplina
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}

const inputClass =
  'w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all'

