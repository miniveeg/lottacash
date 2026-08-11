import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastKind = 'info' | 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

interface ToastCtx {
  push: (message: string, kind?: ToastKind) => void
}

const Ctx = createContext<ToastCtx>({ push: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random()
    setItems((prev) => [...prev, { id, message, kind }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="toast-stack">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  return useContext(Ctx)
}