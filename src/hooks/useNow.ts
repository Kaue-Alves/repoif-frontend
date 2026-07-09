import { useEffect, useState } from 'react'

/**
 * Timestamp atual que se atualiza periodicamente. Para prazos exibidos na tela:
 * sem isto, um prazo que vence com a aba aberta continua aparecendo como ativo.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
