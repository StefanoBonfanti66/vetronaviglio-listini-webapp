export default function Footer() {
  return (
    <footer className="bg-onyx mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <img src="/logo-full.svg" alt="Vetronaviglio" className="h-10 w-auto" />
            <p className="font-sans text-[10px] leading-relaxed text-bone/50 max-w-xs">
              Listino prezzi di vendita riservato alla rete commerciale Vetronaviglio.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-sans text-[9px] uppercase tracking-[0.2em] text-bone/40 font-medium">
              Contatti
            </h4>
            <div className="font-sans text-[10px] text-bone/60 leading-relaxed space-y-1">
              <p>Vetronaviglio S.r.l.</p>
              <p>Via Don Severino Fracassi, 31/39</p>
              <p>20008 Bareggio (MI), Italy</p>
              <p className="pt-2">T. +39 02 9036 4184</p>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-sans text-[9px] uppercase tracking-[0.2em] text-bone/40 font-medium">
              Accesso
            </h4>
            <p className="font-sans text-[10px] text-bone/60">Area riservata commerciali</p>
          </div>
          <div className="space-y-3">
            <h4 className="font-sans text-[9px] uppercase tracking-[0.2em] text-bone/40 font-medium">
              Note
            </h4>
            <p className="font-sans text-[10px] text-bone/50 leading-relaxed">
              Prezzi allineato e rinfusa aggiornati dal listino ufficiale. Per variazioni contattare
              l'ufficio commerciale.
            </p>
          </div>
        </div>
        <div className="border-t border-bone/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="font-sans text-[8px] text-bone/30 uppercase tracking-[0.15em]">
            © {new Date().getFullYear()} Vetronaviglio S.r.l. · P.IVA 03366120271
          </p>
          <p className="font-sans text-[8px] text-bone/20 uppercase tracking-[0.15em]">
            The beauty of being different.
          </p>
        </div>
      </div>
    </footer>
  )
}
