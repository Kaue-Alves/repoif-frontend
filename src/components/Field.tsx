import { useId } from 'react'

/**
 * Rótulo de formulário ligado ao campo por `htmlFor`/`id`.
 *
 * O `id` é gerado aqui e entregue ao filho: é o que garante que a ligação exista
 * sempre — um `<label>` apenas visual deixa o campo anônimo para o leitor de tela e
 * faz o clique no rótulo não focar o campo. Havia seis cópias deste componente, todas
 * sem a ligação.
 *
 * Uso:
 *   <Field label="Senha">
 *     {(id) => <input id={id} type="password" … />}
 *   </Field>
 */
export default function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  /** Nota curta ao lado do rótulo, entre parênteses (ex.: "Opcional"). */
  hint?: string
  required?: boolean
  children: (id: string) => React.ReactNode
}) {
  const id = useId()

  return (
    <div className="space-y-xs">
      <div className="flex items-center gap-sm">
        <label htmlFor={id} className="block text-label-lg text-on-surface">
          {label}
          {required && <span className="text-secondary ml-xs">*</span>}
        </label>
        {hint && <span className="text-label-sm text-on-surface-variant">({hint})</span>}
      </div>
      {children(id)}
    </div>
  )
}
