import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../../components/layouts/AppLayout'
import { getSubject, updateSubject } from './subjects.service'

export default function SubjectEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    if (!id) return
    getSubject(id)
      .then((data) => {
        setName(data.name)
        setDescription(data.description ?? '')
        setIsPublic(data.isPublic)
      })
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Erro ao carregar disciplina.')
      })
      .finally(() => setLoadingData(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setSaving(true)

    try {
      await updateSubject(id!, {
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar disciplina.')
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-xl gap-md text-on-surface-variant">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-body-md">Carregando disciplina...</span>
        </div>
      </AppLayout>
    )
  }

  if (fetchError) {
    return (
      <AppLayout>
        <div className="text-center py-xl">
          <p className="text-body-md text-on-surface-variant">{fetchError}</p>
          <Link to="/dashboard" className="mt-md inline-block text-primary hover:underline text-label-lg">
            Voltar ao Dashboard
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-xs text-label-sm text-on-surface-variant mb-lg">
          <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          <span className="text-on-surface">Editar Disciplina</span>
        </nav>

        <h1 className="text-headline-lg text-on-surface mb-xl">Editar Disciplina</h1>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-lg">
            {/* Name */}
            <Field label="Nome da disciplina" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Algoritmos e Lógica de Programação"
                maxLength={255}
                required
                className={inputClass}
              />
              <p className="text-label-sm text-on-surface-variant mt-xs">{name.length}/255 caracteres</p>
            </Field>

            {/* Description */}
            <Field label="Descrição" hint="Opcional">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva brevemente o conteúdo da disciplina..."
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </Field>

            {/* Visibility */}
            <div>
              <label className="block text-label-lg text-on-surface mb-sm">Visibilidade</label>
              <div className="grid grid-cols-2 gap-md">
                {[
                  { value: false, icon: 'lock', label: 'Privada', desc: 'Apenas você pode ver' },
                  { value: true, icon: 'public', label: 'Pública', desc: 'Qualquer pessoa pode ver' },
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
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 24, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
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
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
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
                disabled={saving || !name.trim()}
                className="flex items-center gap-sm px-lg py-sm bg-primary text-on-primary rounded-lg text-label-lg font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Salvando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                    Salvar Alterações
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

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-xs">
      <div className="flex items-center gap-sm">
        <label className="block text-label-lg text-on-surface">
          {label}
          {required && <span className="text-secondary ml-xs">*</span>}
        </label>
        {hint && <span className="text-label-sm text-on-surface-variant">({hint})</span>}
      </div>
      {children}
    </div>
  )
}
