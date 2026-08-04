import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { session, profile, signOut } = useAuth()

  return (
    <header className="fixed top-0 w-full bg-bone/90 backdrop-blur-sm z-50 border-b border-aluminum/10">
      <nav className="max-w-7xl mx-auto px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 mr-4 sm:mr-8">
          <img src="/logo-full.svg" alt="Vetronaviglio" className="h-10 sm:h-12 w-auto" />
          <span className="font-sans text-[8px] uppercase tracking-[0.25em] text-aluminum hidden lg:block pt-1">
            Listino commerciale
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          {session && profile && (
            <span className="hidden md:block font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum">
              {profile.full_name ?? 'Utente'} · {profile.role}
            </span>
          )}
          {session && profile?.role === 'admin' && (
            <Link
              to="/admin"
              className="font-sans text-[11px] uppercase tracking-[0.2em] text-amber-accent hover:text-onyx transition-colors"
            >
              Gestione dati
            </Link>
          )}
          {session && (
            <button
              onClick={signOut}
              className="font-sans text-[11px] uppercase tracking-[0.2em] text-aluminum hover:text-onyx transition-colors"
            >
              Esci
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
