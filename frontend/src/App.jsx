import { useEffect, useState, useCallback } from 'react'

// In dev: /api/dashboard (Vite proxy → backend). In production: set VITE_API_URL to your backend URL (e.g. https://your-api.onrender.com)
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/dashboard`
  : '/api/dashboard'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '●' },
  { id: 'wallets', label: 'Wallets', icon: '◆' },
  { id: 'transactions', label: 'Transactions', icon: '◇' },
  { id: 'blockchain', label: 'Blockchain', icon: '▣' },
]

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-5 shadow-lg shadow-black/20 transition hover:border-slate-600 hover:bg-slate-800/90">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-50 tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

function TransactionsTable({ transactions, onCopyHash }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-800/40 overflow-hidden shadow-lg shadow-black/20">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/60">
        <h2 className="text-sm font-semibold text-slate-100">
          Recent blockchain transactions
        </h2>
        <span className="text-xs text-slate-500">
          {transactions.length} records · click row to copy hash
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Hash</th>
              <th className="px-4 py-3 text-left">Asset</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Fiat value</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Block</th>
              <th className="px-4 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => onCopyHash(tx.txHash)}
                className="border-t border-slate-700/60 hover:bg-slate-700/40 active:bg-slate-700/60 transition cursor-pointer select-none"
              >
                <td className="px-4 py-2.5 font-mono text-xs text-emerald-300/90">
                  {tx.txHash.slice(0, 10)}…
                </td>
                <td className="px-4 py-2 text-slate-100">{tx.assetSymbol}</td>
                <td className="px-4 py-2 text-right text-slate-100">
                  {tx.amount.toFixed ? tx.amount.toFixed(4) : tx.amount}
                </td>
                <td className="px-4 py-2 text-right text-slate-300">
                  ${tx.fiatValue?.toLocaleString?.() ?? tx.fiatValue}
                </td>
                <td className="px-4 py-2 text-left">
                  <span className="rounded-full bg-slate-800/90 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-300">
                    {tx.type}
                  </span>
                </td>
                <td className="px-4 py-2 text-left">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-emerald-400">
                    {tx.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right text-slate-300">
                  #{tx.blockHeight}
                </td>
                <td className="px-4 py-2 text-right text-slate-400">
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BlockchainTimeline({ transactions }) {
  const recent = transactions.slice(0, 6)
  return (
    <div className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-800/40 p-4 shadow-lg shadow-black/20">
      <h2 className="text-sm font-semibold text-slate-100 mb-3">
        Latest blocks
      </h2>
      <ol className="space-y-3">
        {recent.map((tx) => (
          <li key={tx.id} className="flex items-start gap-3 rounded-lg py-1.5 px-2 -mx-2 hover:bg-slate-700/30 transition">
            <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px] shadow-emerald-500/20 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-slate-400">
                Block{' '}
                <span className="font-semibold text-slate-100">
                  #{tx.blockHeight}
                </span>{' '}
                • {tx.assetSymbol} {tx.type.toLowerCase()}
              </p>
              <p className="mt-1 font-mono text-[11px] text-slate-500">
                {tx.blockHash}
              </p>
            </div>
            <span className="text-[11px] text-slate-500">
              {new Date(tx.timestamp).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function App() {
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeNav, setActiveNav] = useState('overview')
  const [copyToast, setCopyToast] = useState(false)
  const [actionToast, setActionToast] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/summary`),
        fetch(`${API_BASE}/transactions`),
      ])
      if (!summaryRes.ok || !txRes.ok) {
        const failedRes = !summaryRes.ok ? summaryRes : txRes
        let msg = failedRes.status === 404
          ? 'API not found. Is the Spring Boot backend running on port 8080?'
          : `Server error (${failedRes.status}).`
        try {
          const errBody = await failedRes.clone().json()
          if (errBody?.message) msg += ` ${errBody.message}`
        } catch (_) {}
        throw new Error(msg)
      }
      const summaryJson = await summaryRes.json()
      const txJson = await txRes.json()
      setSummary(summaryJson)
      setTransactions(Array.isArray(txJson) ? txJson : [])
    } catch (e) {
      const isNetworkError = e.name === 'TypeError' && (e.message.includes('fetch') || e.message.includes('network'))
      const msg = isNetworkError
        ? 'Cannot reach backend. Start it with: cd backend && ./mvnw spring-boot:run'
        : (e.message || 'Failed to load dashboard data')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCopyHash = useCallback((hash) => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 2000)
    })
  }, [])

  const handleExportCsv = useCallback(() => {
    if (transactions.length === 0) {
      setActionToast('No transactions to export')
      setTimeout(() => setActionToast(null), 2500)
      return
    }
    const headers = ['Hash', 'Asset', 'Amount', 'Fiat value', 'Type', 'Status', 'Block', 'Time']
    const rows = transactions.map((tx) => [
      tx.txHash,
      tx.assetSymbol,
      tx.amount?.toFixed?.(4) ?? tx.amount,
      tx.fiatValue ?? '',
      tx.type,
      tx.status,
      tx.blockHeight,
      tx.timestamp ? new Date(tx.timestamp).toISOString() : '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `novachain-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setActionToast('CSV downloaded')
    setTimeout(() => setActionToast(null), 2500)
  }, [transactions])

  const handleNewTransfer = useCallback(() => {
    setActionToast('Demo only — connect a wallet in production')
    setTimeout(() => setActionToast(null), 3000)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Toasts */}
      {copyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-emerald-500 text-slate-900 px-4 py-2 text-sm font-medium shadow-lg" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          Hash copied to clipboard
        </div>
      )}
      {actionToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-slate-700 text-slate-100 px-4 py-2 text-sm font-medium shadow-lg border border-slate-600">
          {actionToast}
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-6xl">
        <aside className="hidden w-64 border-r border-slate-800/80 bg-slate-950/80 px-5 py-6 lg:flex flex-col">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              ₿
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                NovaChain
              </p>
              <p className="text-[11px] text-slate-500">
                Fintech blockchain console
              </p>
            </div>
          </div>
          <nav className="mt-8 space-y-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                  activeNav === item.id
                    ? 'bg-slate-700/80 text-emerald-400 border border-slate-600'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${activeNav === item.id ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-900 p-3 text-xs text-slate-300">
            <p className="font-medium text-emerald-300">
              Sandbox environment
            </p>
            <p className="mt-1 text-slate-400">
              Demo data only. Connect a real node or ledger in production.
            </p>
          </div>
        </aside>

        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-400">
                Dashboard
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                Fintech blockchain overview
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCsv}
                disabled={loading || transactions.length === 0}
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/80 hover:border-slate-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export CSV
              </button>
              <button
                onClick={handleNewTransfer}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md hover:bg-emerald-400 active:scale-[0.98] transition"
              >
                New transfer
              </button>
              <button
                onClick={load}
                disabled={loading}
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/80 transition disabled:opacity-50"
                title="Refresh data"
              >
                ↻ Refresh
              </button>
            </div>
          </header>

          {loading && (
            <div className="mt-8 flex items-center gap-3 text-slate-400">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-emerald-400" />
              <span className="text-sm">Loading dashboard…</span>
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {summary && !loading && !error && (
            <>
              <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Portfolio value"
                  value={`$${(Number(summary.portfolioValue) ?? 0).toLocaleString()}`}
                  sub="All wallets across chain"
                />
                <StatCard
                  label="Fiat balance"
                  value={`$${(Number(summary.fiatBalance) ?? 0).toLocaleString()}`}
                  sub="Available in custodial accounts"
                />
                <StatCard
                  label="Crypto balance"
                  value={`${(Number(summary.cryptoBalance) ?? 0).toFixed(4)} BTC eq.`}
                  sub="On-chain holdings"
                />
                <StatCard
                  label="PnL (24h)"
                  value={`$${(Number(summary.dailyPnl) ?? 0).toLocaleString()}`}
                  sub="Realised + unrealised"
                />
              </section>

              <section className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <TransactionsTable transactions={transactions} onCopyHash={handleCopyHash} />
                </div>
                <div>
                  <div className="rounded-2xl border border-slate-700/80 bg-slate-800/40 p-4 shadow-lg shadow-black/20">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Top assets
                    </p>
                    <ul className="mt-3 space-y-2 text-sm">
                      {(summary.topAssets || []).map((asset) => (
                        <li
                          key={asset}
                          className="flex items-center justify-between rounded-xl bg-slate-700/40 border border-slate-600/50 px-3 py-2.5 hover:bg-slate-700/60 transition"
                        >
                          <span className="font-medium text-slate-100">
                            {asset}
                          </span>
                          <span className="text-xs text-emerald-400 font-medium">
                            Active
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <BlockchainTimeline transactions={transactions} />
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
