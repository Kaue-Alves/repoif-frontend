import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guarda de acessibilidade sobre o código-fonte.
 *
 * Não renderiza nada: varre os `.tsx` e reprova padrões que quebram leitor de tela.
 * É deliberado que seja um teste e não uma regra de lint — assim a exigência viaja
 * junto com a suíte e uma tela nova nasce acessível ou reprova.
 */

const SRC = join(__dirname, '..')

function arquivosTsx(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) return arquivosTsx(caminho)
    if (!nome.endsWith('.tsx') || nome.endsWith('.spec.tsx')) return []
    return [caminho]
  })
}

/** Extrai as tags de abertura de um elemento, respeitando `{ }` e aspas. */
function tagsDeAbertura(src: string, nomes: string[]): { nome: string; attrs: string; pos: number }[] {
  const achados: { nome: string; attrs: string; pos: number }[] = []
  const re = new RegExp(`<(${nomes.join('|')})\\b`, 'g')

  for (const m of src.matchAll(re)) {
    let i = m.index + m[0].length
    let chaves = 0
    let aspas: string | null = null

    while (i < src.length) {
      const c = src[i]
      if (aspas) {
        if (c === aspas) aspas = null
      } else if (c === '"' || c === "'" || c === '`') {
        aspas = c
      } else if (c === '{') {
        chaves++
      } else if (c === '}') {
        chaves--
      } else if (c === '>' && chaves === 0) {
        break
      }
      i++
    }
    achados.push({ nome: m[1], attrs: src.slice(m.index + m[0].length, i), pos: m.index })
  }
  return achados
}

const arquivos = arquivosTsx(SRC)
const local = (caminho: string, src: string, pos: number) =>
  `${relative(SRC, caminho)}:${src.slice(0, pos).split('\n').length}`

describe('acessibilidade do código-fonte', () => {
  it('há telas para varrer', () => {
    expect(arquivos.length).toBeGreaterThan(20)
  })

  /**
   * Material Symbols desenha o ícone a partir do **texto** do elemento (ligadura).
   * Sem `aria-hidden`, o leitor de tela lê "chevron_right", "delete", "menu_book"
   * em voz alta no meio do conteúdo.
   */
  it('todo ícone Material Symbols é marcado como decorativo', () => {
    const faltando: string[] = []

    for (const caminho of arquivos) {
      const src = readFileSync(caminho, 'utf8')
      for (const { attrs, pos } of tagsDeAbertura(src, ['span'])) {
        if (!attrs.includes('material-symbols-outlined')) continue
        if (attrs.includes('aria-hidden')) continue
        faltando.push(local(caminho, src, pos))
      }
    }

    expect(faltando).toEqual([])
  })

  /**
   * Um campo sem nome acessível é anunciado como "editar texto", sem dizer o quê.
   * Vale qualquer das três formas: `id` ligado a um `htmlFor`, `aria-label`, ou o
   * campo envolvido pelo próprio `<label>` (associação implícita).
   */
  it('todo campo de formulário tem nome acessível', () => {
    const semNome: string[] = []

    for (const caminho of arquivos) {
      const src = readFileSync(caminho, 'utf8')
      for (const { nome, attrs, pos } of tagsDeAbertura(src, ['input', 'textarea', 'select'])) {
        if (/\bid=/.test(attrs) || attrs.includes('aria-label')) continue
        // display:none não é exposto ao leitor de tela (o controle é o botão que o aciona).
        if (attrs.includes('className="hidden"')) continue

        const antes = src.slice(Math.max(0, pos - 400), pos)
        const dentroDeLabel = antes.lastIndexOf('<label') > antes.lastIndexOf('</label>')
        if (dentroDeLabel) continue

        semNome.push(`${local(caminho, src, pos)} <${nome}>`)
      }
    }

    expect(semNome).toEqual([])
  })
})
