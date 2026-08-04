import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getCapacities,
  getColors,
  getConfig,
  getMaterials,
  getPriceBrackets,
} from '../lib/api'
import { calcBracket } from '../lib/pricing'
import type {
  Capacity,
  Color,
  ListinoConfig,
  Material,
  PriceBracket,
} from '../lib/types'
import type { BracketResult } from '../lib/pricing'

function euro(x: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(x)
}

export default function PriceSearchPage() {
  const { session } = useAuth()
  const accessToken = session?.access_token
  const [materials, setMaterials] = useState<Material[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [capacities, setCapacities] = useState<Capacity[]>([])
  const [brackets, setBrackets] = useState<PriceBracket[]>([])

  const [materialId, setMaterialId] = useState('')
  const [colorId, setColorId] = useState('')
  const [capacityId, setCapacityId] = useState('')
  const [config, setConfig] = useState<ListinoConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null)

  useEffect(() => {
    if (!accessToken) return
    Promise.all([
      getMaterials(accessToken, true),
      getColors(accessToken, true),
      getCapacities(accessToken, true),
      getPriceBrackets(accessToken),
    ])
      .then(([m, c, ca, b]) => {
        setMaterials(m)
        setColors(c)
        setCapacities(ca)
        setBrackets(b)
        if (m.length > 0) setMaterialId(m[0].id)
        if (c.length > 0) setColorId(c[0].id)
        if (ca.length > 0) setCapacityId(ca[0].id)
      })
      .catch((e) => setConfigError(String(e)))
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !materialId || !colorId || !capacityId) {
      setConfig(null)
      return
    }
    let cancelled = false
    getConfig(accessToken, capacityId, materialId, colorId)
      .then((cfg) => {
        if (!cancelled) {
          setConfig(cfg)
          setConfigError(
            cfg ? null : 'Nessun listino configurato per questa combinazione',
          )
        }
      })
      .catch((e) => {
        if (!cancelled) setConfigError(String(e))
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, materialId, colorId, capacityId])

  const results: BracketResult[] = useMemo(() => {
    if (!config) return []
    return brackets
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((b) =>
        calcBracket(
          {
            peso_disegno_g: config.peso_disegno_g,
            mp_costos_kg: config.mp_costos_kg,
            mp_utilizzi_pct: config.mp_utilizzi_pct,
            imballo_items: config.imballo_items,
            pezzi_pallet: config.pezzi_pallet,
            allineato: config.allineato,
            rinfusa: config.rinfusa,
            rinfusaRicaricoDiv100: config.rinfusa_ricarico_div_100,
          },
          {
            sort_order: b.sort_order,
            quantita_lotto: b.quantita_lotto,
            sfrido: b.sfrido,
            ricarico_vendite: b.ricarico_vendite,
            regola_vendita: b.regola_vendita,
          },
        ),
      )
  }, [config, brackets])

  useEffect(() => {
    if (!results.length) {
      setSelectedOrder(null)
      return
    }
    const last = results[results.length - 1].bracket.sort_order
    setSelectedOrder((cur) =>
      cur != null && results.some((r) => r.bracket.sort_order === cur)
        ? cur
        : last,
    )
  }, [results])

  const selectedResult = useMemo(
    () =>
      results.find((r) => r.bracket.sort_order === selectedOrder) ??
      results[results.length - 1],
    [results, selectedOrder],
  )

  const bracketMeta = useMemo(
    () => new Map(brackets.map((b) => [b.sort_order, b])),
    [brackets],
  )

  const materialName = useMemo(
    () => materials.find((m) => m.id === materialId)?.name ?? '',
    [materials, materialId],
  )
  const colorName = useMemo(
    () => colors.find((c) => c.id === colorId)?.name ?? '',
    [colors, colorId],
  )
  const capacityLabel = useMemo(
    () => capacities.find((c) => c.id === capacityId)?.label ?? '',
    [capacities, capacityId],
  )

  const handlePrint = () => {
    window.print()
  }

  const selectCls =
    'mt-1 block w-full border border-aluminum/20 bg-white px-3 py-2.5 font-sans text-sm text-onyx focus:border-onyx focus:outline-none transition-colors'

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum">
            Materiale
          </label>
          <select
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            className={selectCls}
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum">
            Colore
          </label>
          <select
            value={colorId}
            onChange={(e) => setColorId(e.target.value)}
            className={selectCls}
          >
            {colors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum">
            Capacità (ml)
          </label>
          <select
            value={capacityId}
            onChange={(e) => setCapacityId(e.target.value)}
            className={selectCls}
          >
            {capacities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {configError && !config && (
        <p className="mt-6 border-l-2 border-amber-accent/40 bg-surface p-4 font-sans text-sm text-onyx/70">
          {configError}
        </p>
      )}

      {config && (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Prezzi di vendita
            </h2>
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-aluminum">
              {capacityLabel} ml · {materialName} · {colorName}
            </p>
            <button
              onClick={handlePrint}
              className="border border-onyx px-5 py-2.5 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-onyx hover:bg-onyx hover:text-bone transition-all duration-300"
            >
              Stampa / PDF
            </button>
          </div>

          <div className="mt-4 hidden overflow-x-auto bg-white border border-aluminum/10 sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aluminum/10 text-left font-sans text-[10px] uppercase tracking-[0.15em] text-aluminum">
                  <th className="px-4 py-3 font-medium">Fascia</th>
                  <th className="px-4 py-3 font-medium">Quantità</th>
                  <th className="px-4 py-3 font-medium">Prezzo allineato</th>
                  <th className="px-4 py-3 font-medium">Prezzo rinfusa</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const meta = bracketMeta.get(r.bracket.sort_order)
                  return (
                    <tr key={r.bracket.sort_order} className="border-b border-aluminum/10 last:border-b-0">
                      <td className="px-4 py-3 font-sans text-[13px] text-aluminum">
                        {(meta?.da ?? 0).toLocaleString('it-IT')} –{' '}
                        {(meta?.fino ?? 0).toLocaleString('it-IT')}
                      </td>
                      <td className="px-4 py-3 font-sans text-sm font-medium text-onyx/80">
                        {r.bracket.quantita_lotto.toLocaleString('it-IT')}
                      </td>
                      <td className="px-4 py-3 font-sans text-sm font-medium text-amber-accent">
                        {euro(r.allineato.prezzoVendita)}
                      </td>
                      <td className="px-4 py-3 font-sans text-sm font-medium text-amber-accent">
                        {euro(r.rinfusa.prezzoVendita)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-3 sm:hidden">
            {results.map((r) => {
              const meta = bracketMeta.get(r.bracket.sort_order)
              return (
                <div key={r.bracket.sort_order} className="bg-white border border-aluminum/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-aluminum">
                      Fascia
                    </span>
                    <span className="font-sans text-[13px] text-onyx/80">
                      {(meta?.da ?? 0).toLocaleString('it-IT')} –{' '}
                      {(meta?.fino ?? 0).toLocaleString('it-IT')}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-aluminum">
                      Quantità
                    </span>
                    <span className="font-sans text-sm font-medium text-onyx/80">
                      {r.bracket.quantita_lotto.toLocaleString('it-IT')}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-aluminum">
                      Prezzo allineato
                    </span>
                    <span className="font-sans text-sm font-medium text-amber-accent">
                      {euro(r.allineato.prezzoVendita)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-aluminum">
                      Prezzo rinfusa
                    </span>
                    <span className="font-sans text-sm font-medium text-amber-accent">
                      {euro(r.rinfusa.prezzoVendita)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="flex items-end gap-2 md:col-span-2 print:hidden">
              <div className="max-w-xs">
                <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum">
                  Fascia per dettaglio
                </label>
                <select
                  value={selectedOrder ?? ''}
                  onChange={(e) => setSelectedOrder(Number(e.target.value))}
                  className={selectCls}
                >
                  {results.map((r) => {
                    const meta = bracketMeta.get(r.bracket.sort_order)
                    return (
                      <option key={r.bracket.sort_order} value={r.bracket.sort_order}>
                        Da {(meta?.da ?? 0).toLocaleString('it-IT')} – fino a{' '}
                        {(meta?.fino ?? 0).toLocaleString('it-IT')}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
            <BreakdownCard
              title={`Allineato — ${selectedResult.bracket.quantita_lotto.toLocaleString('it-IT')} pz`}
              result={selectedResult}
              side="allineato"
            />
            <BreakdownCard
              title={`Rinfusa — ${selectedResult.bracket.quantita_lotto.toLocaleString('it-IT')} pz`}
              result={selectedResult}
              side="rinfusa"
            />
          </div>
        </>
      )}
    </div>
  )
}

function BreakdownCard({
  title,
  result,
  side,
}: {
  title: string
  result: BracketResult | undefined
  side: 'allineato' | 'rinfusa'
}) {
  if (!result) return null
  const a = result.allineato
  const r = result.rinfusa
  const d = side === 'allineato' ? a : r
  return (
    <div className="border border-aluminum/10 bg-white p-5">
      <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum">
        {title}
      </h3>
      <dl className="mt-3 space-y-1 font-sans text-xs">
        <Row label="Peso con sfrido (g)" value={`${a.pesoConSfrido} g`} />
        <Row label="Costo materia prima" value={euro(a.costoMateriaPrima)} />
        <Row label="Costo imballo" value={euro(a.costoImballo)} />
        <Row label="Attrezzaggio" value={euro(a.costoAttrezzaggio)} />
        <Row
          label="Uomo + macchina"
          value={euro(side === 'allineato' ? a.costoUomoMacchina : r.costoUomoMacchina)}
        />
        <Row label="Totale costo" value={euro(d.totaleCosto)} />
        <Row label="Totale con ricarico ind." value={euro(d.totaleConRicaricoInd)} />
        <Row label="Costo unitario" value={euro(d.costoUnitario)} />
        <Row label="Prezzo di vendita" value={euro(d.prezzoVendita)} strong />
      </dl>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between border-b border-aluminum/5 py-1 last:border-b-0">
      <dt className="text-aluminum">{label}</dt>
      <dd className={strong ? 'font-medium text-amber-accent' : 'text-onyx/80'}>{value}</dd>
    </div>
  )
}
