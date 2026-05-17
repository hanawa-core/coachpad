'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

/**
 * モバイル対応のアプリシェル
 * - md未満：サイドバーがドロワー化（ハンバーガーで開閉）
 * - md以上：サイドバー常時表示
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // ルート変更で自動クローズ
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // ESCキーで閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* デスクトップサイドバー（md以上で常時表示） */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* モバイルドロワー */}
      {mobileOpen && (
        <>
          {/* バックドロップ */}
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          {/* ドロワー本体 */}
          <div className="fixed inset-y-0 left-0 z-50 md:hidden animate-slide-in-left">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <MenuButtonContext.Provider value={{ openMenu: () => setMobileOpen(true) }}>
            {children}
          </MenuButtonContext.Provider>
        </main>
      </div>
    </div>
  )
}

import { createContext, useContext } from 'react'

const MenuButtonContext = createContext<{ openMenu: () => void }>({
  openMenu: () => {},
})

export function useMobileMenu() {
  return useContext(MenuButtonContext)
}
