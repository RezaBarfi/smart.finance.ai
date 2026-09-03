import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, Legend } from 'recharts'
import { useFinance, aggregateTotals, DEFAULT_ALLOC, AllocPcts } from '../lib/useFinance'
import { supabase, TxRow, MonthRow, IncomeEntry } from '../lib/supabase'
import { formatToman, toFaDigits, monthLabel, PERSIAN_MONTHS, compoundInterest, pctOf, gregorianToJalaliString, jalaliToISODate, todayJalaliYMD, jalaliMonthDays } from '../lib/format'
import { Modal, StatCard, ProgressBar, Spinner } from './ui'
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, Trash2, LogOut, ChevronDown, Sun, Moon, Settings, FileSpreadsheet, Calendar } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import * as XLSX from 'xlsx'
import clsx from 'clsx'

const CAT_META = {
  invest: { label: 'سرمایه‌گذاری', color: '#10b981', bg: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700', darkSoft: 'dark:bg-emerald-950/50 dark:text-emerald-400', icon: TrendingUp },
  expense: { label: 'هزینه‌ها', color: '#ef4444', bg: 'bg-rose-500', soft: 'bg-rose-50 text-rose-700', darkSoft: 'dark:bg-rose-950/50 dark:text-rose-400', icon: TrendingDown },
  save: { label: 'پس‌انداز', color: '#f59e0b', bg: 'bg-amber-500', soft: 'bg-amber-50 text-amber-700', darkSoft: 'dark:bg-amber-950/50 dark:text-amber-400', icon: PiggyBank },
} as const

type CatKey = keyof typeof CAT_META

const YEAR_RANGE = Array.from({ length: 1420 - 1405 + 1 }, (_, i) => 1405 + i)

export function Dashboard() {
  const auth = useAuth()
  const { theme, toggle } = useTheme()
  const f = useFinance()
  const [incomeModal, setIncomeModal] = useState(false)
  const [txModal, setTxModal] = useState<CatKey | null>(null)
  const [settingsModal, setSettingsModal] = useState(false)
  const [allTxs, setAllTxs] = useState<TxRow[]>([])
  const [allMonths, setAllMonths] = useState<MonthRow[]>([])
  const [allEntries, setAllEntries] = useState<IncomeEntry[]>([])
  const [compOpen, setCompOpen] = useState(false)

  useEffect(() => {
    let active = true
    supabase.from('transactions').select('*').order('date', { ascending: true })
      .then(({ data }) => { if (active) setAllTxs((data as TxRow[]) ?? []) })
    supabase.from('months').select('*').order('year', { ascending: true }).order('month', { ascending: true })
      .then(({ data }) => { if (active) setAllMonths((data as MonthRow[]) ?? []) })
    supabase.from('income_entries').select('*').order('income_date', { ascending: true })
      .then(({ data }) => { if (active) setAllEntries((data as IncomeEntry[]) ?? []) })
    return () => { active = false }
  }, [f.txs.length, f.months.length, f.entries.length])

  const totals = aggregateTotals(allMonths, allTxs)

  const allocData = [
    { name: `سرمایه‌گذاری (${toFaDigits(f.alloc.invest)}٪)`, value: f.budgets.invest, color: CAT_META.invest.color },
    { name: `هزینه‌ها (${toFaDigits(f.alloc.expense)}٪)`, value: f.budgets.expense, color: CAT_META.expense.color },
    { name: `پس‌انداز (${toFaDigits(f.alloc.save)}٪)`, value: f.budgets.save, color: CAT_META.save.color },
  ].filter(d => d.value > 0)

  const trendData = useMemo(() => {
    return [...allMonths]
      .sort((a,b) => a.year - b.year || a.month - b.month)
      .slice(-6)
      .map(m => {
        const mTxs = allTxs.filter(t => t.month_id === m.id)
        return {
          label: monthLabel(m.year, m.month).split(' ')[0],
          درآمد: Number(m.income),
          سرمایه‌گذاری: mTxs.filter(t => t.category==='invest').reduce((s,t)=>s+Number(t.amount),0),
          هزینه: mTxs.filter(t => t.category==='expense').reduce((s,t)=>s+Number(t.amount),0),
          پس‌انداز: mTxs.filter(t => t.category==='save').reduce((s,t)=>s+Number(t.amount),0),
        }
      })
  }, [allMonths, allTxs])

  const netWorthData = useMemo(() => {
    let cum = 0
    return [...allMonths]
      .sort((a,b) => a.year - b.year || a.month - b.month)
      .map(m => {
        const mTxs = allTxs.filter(t => t.month_id === m.id)
        cum += mTxs.filter(t => t.category==='invest').reduce((s,t)=>s+Number(t.amount),0)
        cum += mTxs.filter(t => t.category==='save').reduce((s,t)=>s+Number(t.amount),0)
        return { label: monthLabel(m.year, m.month), ارزش: cum }
      })
  }, [allMonths, allTxs])

  const exportExcel = () => {
    const monthMap = new Map(allMonths.map(m => [m.id, m]))
    const entryRows = allEntries.map(e => {
      const m = monthMap.get(e.month_id)
      return {
        'سال': m?.year ?? '',
        'ماه': m ? PERSIAN_MONTHS[m.month - 1] : '',
        'مبلغ درآمد': Number(e.amount),
        'تاریخ واریز': gregorianToJalaliString(e.income_date),
        '٪ سرمایه‌گذاری': e.alloc_invest,
        '٪ هزینه‌ها': e.alloc_expense,
        '٪ پس‌انداز': e.alloc_save,
        'یادداشت': e.note ?? '',
      }
    })
    const txRows = allTxs.map(t => {
      const m = monthMap.get(t.month_id)
      return {
        'سال': m?.year ?? '',
        'ماه': m ? PERSIAN_MONTHS[m.month - 1] : '',
        'دسته': CAT_META[t.category as CatKey]?.label ?? t.category,
        'نوع': t.sub_type ?? '',
        'مبلغ': Number(t.amount),
        'یادداشت': t.note ?? '',
        'تاریخ تراکنش': gregorianToJalaliString(t.date),
      }
    })
    const summary = allMonths.map(m => {
      const mTxs = allTxs.filter(t => t.month_id === m.id)
      const mEntries = allEntries.filter(e => e.month_id === m.id)
      const mIncome = mEntries.reduce((s,e) => s + Number(e.amount), 0)
      const bInv = mEntries.reduce((s,e) => s + (Number(e.amount) * e.alloc_invest) / 100, 0)
      const bExp = mEntries.reduce((s,e) => s + (Number(e.amount) * e.alloc_expense) / 100, 0)
      const bSave = mEntries.reduce((s,e) => s + (Number(e.amount) * e.alloc_save) / 100, 0)
      return {
        'سال': m.year,
        'ماه': PERSIAN_MONTHS[m.month - 1],
        'درآمد کل': mIncome,
        'تعداد ثبت درآمد': mEntries.length,
        'سقف سرمایه‌گذاری': bInv,
        'سقف هزینه‌ها': bExp,
        'سقف پس‌انداز': bSave,
        'مصرف سرمایه‌گذاری': mTxs.filter(t => t.category==='invest').reduce((s,t)=>s+Number(t.amount),0),
        'مصرف هزینه‌ها': mTxs.filter(t => t.category==='expense').reduce((s,t)=>s+Number(t.amount),0),
        'مصرف پس‌انداز': mTxs.filter(t => t.category==='save').reduce((s,t)=>s+Number(t.amount),0),
      }
    })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'خلاصه ماهانه')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(entryRows), 'ثبت‌های درآمد')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), 'تراکنش‌ها')
    XLSX.writeFile(wb, `هوش-دفتر-مالی-${todayJalaliYMD().year}.xlsx`)
  }

  if (f.loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>
  }

  const softBg = 'bg-slate-100 dark:bg-slate-800'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><Wallet size={20} /></div>
            <div>
              <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">هوش دفتر مالی من</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500">{auth.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="btn-ghost p-2.5" title={theme === 'light' ? 'حالت تاریک' : 'حالت روشن'}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button onClick={()=>setSettingsModal(true)} className="btn-ghost p-2.5" title="تنظیمات"><Settings size={18} /></button>
            <button onClick={auth.signOut} className="btn-ghost text-xs"><LogOut size={16} /> خروج</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">داشبورد ماهانه</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">درآمد خود را ثبت کنید تا به‌صورت خودکار بر اساس درصد انتخابی تقسیم شود</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={f.selMonth} onChange={e=>f.setSelMonth(+e.target.value)} className="input w-auto py-2">
                {PERSIAN_MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <select value={f.selYear} onChange={e=>f.setSelYear(+e.target.value)} className="input w-auto py-2">
                {YEAR_RANGE.map(y => <option key={y} value={y}>{toFaDigits(y)}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="درآمد ماه" value={formatToman(f.income)} sub={monthLabel(f.selYear, f.selMonth)} color="bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400" icon={<Wallet size={16}/>} />
            <StatCard label="سرمایه خالص" value={formatToman(totals.netWorth)} sub="تجمعی همه ماه‌ها" color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" icon={<TrendingUp size={16}/>} />
            <StatCard label="کل هزینه‌ها" value={formatToman(totals.totalExpense)} sub="تجمعی" color="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" icon={<TrendingDown size={16}/>} />
            <StatCard label="کل پس‌انداز" value={formatToman(totals.totalSave)} sub="تجمعی" color="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" icon={<PiggyBank size={16}/>} />
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={()=>setIncomeModal(true)} className="btn-primary"><Plus size={16}/> ثبت درآمد جدید</button>
            {f.current && <button onClick={()=>f.deleteMonth(f.current!.id)} className="btn-danger"><Trash2 size={16}/> حذف ماه</button>}
          </div>
        </section>

        {f.entries.length > 0 && f.income > 0 ? (
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="card lg:col-span-1">
              <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">تخصیص درآمد</h3>
              <div className="relative h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={3} strokeWidth={0}>
                      {allocData.map((d,i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v:number)=>formatToman(v)} contentStyle={{fontFamily:'Vazirmatn',borderRadius:'12px',border:'none',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-400 dark:text-slate-500">درآمد ماه</span>
                  <span className="tnum text-xl font-extrabold text-slate-800 dark:text-slate-100">{formatToman(f.income)}</span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {allocData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className="h-2.5 w-2.5 rounded-full" style={{background:d.color}} />{d.name}</span>
                    <span className="tnum font-semibold text-slate-700 dark:text-slate-200">{formatToman(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:col-span-2 sm:grid-cols-3">
              {(Object.keys(CAT_META) as CatKey[]).map(cat => (
                <BudgetCard key={cat} cat={cat} f={f} onAdd={()=>setTxModal(cat)} />
              ))}
            </div>
          </section>
        ) : (
          <section className="card flex flex-col items-center justify-center py-12 text-center animate-fade-in">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400"><Wallet size={28}/></div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">برای شروع، درآمد این ماه را ثبت کنید</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">پس از ثبت درآمد، مبلغ به‌صورت خودکار بر اساس درصد انتخابی شما تقسیم می‌شود.</p>
            <button onClick={()=>setIncomeModal(true)} className="btn-primary mt-4"><Plus size={16}/> ثبت درآمد جدید</button>
          </section>
        )}

        {trendData.length > 0 && (
          <section className="card">
            <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">روند ۶ ماه اخیر</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:opacity-20" />
                  <XAxis dataKey="label" tick={{fontFamily:'Vazirmatn',fontSize:12,fill:'#64748b'}} />
                  <YAxis tickFormatter={v=>toFaDigits(String(Math.round(v/1000000)))+'م'} tick={{fontFamily:'Vazirmatn',fontSize:11,fill:'#94a3b8'}} width={50} />
                  <Tooltip formatter={(v:number)=>formatToman(v)} contentStyle={{fontFamily:'Vazirmatn',borderRadius:'12px',border:'none',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Legend wrapperStyle={{fontFamily:'Vazirmatn',fontSize:12}} />
                  <Bar dataKey="درآمد" fill="#338eff" radius={[6,6,0,0]} />
                  <Bar dataKey="سرمایه‌گذاری" fill="#10b981" radius={[6,6,0,0]} />
                  <Bar dataKey="هزینه" fill="#ef4444" radius={[6,6,0,0]} />
                  <Bar dataKey="پس‌انداز" fill="#f59e0b" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          {netWorthData.length > 0 && (
            <div className="card">
              <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">رشد خالص سرمایه (تجمعی)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthData}>
                    <defs>
                      <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:opacity-20" />
                    <XAxis dataKey="label" tick={{fontFamily:'Vazirmatn',fontSize:10,fill:'#64748b'}} />
                    <YAxis tickFormatter={v=>toFaDigits(String(Math.round(v/1000000)))+'م'} tick={{fontFamily:'Vazirmatn',fontSize:11,fill:'#94a3b8'}} width={50} />
                    <Tooltip formatter={(v:number)=>formatToman(v)} contentStyle={{fontFamily:'Vazirmatn',borderRadius:'12px',border:'none',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="ارزش" stroke="#10b981" strokeWidth={2.5} fill="url(#nw)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card">
            <button onClick={()=>setCompOpen(o=>!o)} className="flex w-full items-center justify-between text-right">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">محاسبه سود مرکب و سرمایه‌گذاری طلا</h3>
              <ChevronDown size={18} className={clsx('text-slate-400 transition-transform', compOpen && 'rotate-180')} />
            </button>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">پیش‌بینی رشد پس‌انداز و سرمایه‌گذاری طلا در آینده</p>
            {compOpen && <CompoundCalculator currentSave={f.spent.save} currentInvest={f.spent.invest} />}
          </div>
        </section>

        {f.income > 0 && (
          <section className="card">
            <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">ثبت‌های درآمد {monthLabel(f.selYear, f.selMonth)}</h3>
            {f.entries.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">هنوز درآمدی ثبت نشده است.</p>
            ) : (
              <div className="space-y-2">
                {f.entries.map(e => (
                  <div key={e.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400"><Wallet size={18}/></span>
                      <div>
                        <p className="tnum text-sm font-bold text-slate-700 dark:text-slate-200">{formatToman(Number(e.amount))} ت</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{gregorianToJalaliString(e.income_date)}</p>
                        {e.note && <p className="text-xs text-slate-400 dark:text-slate-500">{e.note}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-left text-xs text-slate-400 dark:text-slate-500">
                        <p>سرمایه: {toFaDigits(e.alloc_invest)}٪</p>
                        <p>هزینه: {toFaDigits(e.alloc_expense)}٪</p>
                        <p>پس‌انداز: {toFaDigits(e.alloc_save)}٪</p>
                      </div>
                      <button onClick={()=>f.deleteIncomeEntry(e.id)} className="text-slate-300 hover:text-rose-500 transition-colors dark:text-slate-600"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {f.income > 0 && (
          <section className="card">
            <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">تراکنش‌های {monthLabel(f.selYear, f.selMonth)}</h3>
            {f.txs.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">هنوز تراکنشی ثبت نشده است. از کارت‌های بالا تراکنش اضافه کنید.</p>
            ) : (
              <div className="space-y-2">
                {f.txs.map(t => {
                  const meta = CAT_META[t.category as CatKey]
                  const Icon = meta.icon
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <span className={clsx('flex h-9 w-9 items-center justify-center rounded-lg', meta.soft, meta.darkSoft)}><Icon size={18}/></span>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.sub_type ?? meta.label}</p>
                          {t.note && <p className="text-xs text-slate-400 dark:text-slate-500">{t.note}</p>}
                          <p className="text-xs text-slate-400 dark:text-slate-500">{gregorianToJalaliString(t.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tnum text-sm font-bold text-slate-700 dark:text-slate-200">{formatToman(Number(t.amount))} ت</span>
                        <button onClick={()=>f.deleteTx(t.id)} className="text-slate-300 hover:text-rose-500 transition-colors dark:text-slate-600"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </main>

      <IncomeModal
        open={incomeModal}
        onClose={()=>setIncomeModal(false)}
        selYear={f.selYear}
        selMonth={f.selMonth}
        currentIncome={f.income}
        onSave={async (inc,note,idate,alloc)=>{ await f.addIncomeEntry(inc,idate,note,alloc); setIncomeModal(false) }}
      />

      {txModal && (
        <TxModal cat={txModal} selYear={f.selYear} selMonth={f.selMonth} budget={f.budgets[txModal]} spent={f.spent[txModal]} onClose={()=>setTxModal(null)} onAdd={async (amt,st,note,date)=>{ await f.addTx(txModal,amt,st,note,date); setTxModal(null) }} />
      )}

      <SettingsModal open={settingsModal} onClose={()=>setSettingsModal(false)} onExport={exportExcel} monthsCount={allMonths.length} txsCount={allTxs.length} entriesCount={allEntries.length} />
    </div>
  )
}

function BudgetCard({ cat, f, onAdd }: { cat: CatKey; f: ReturnType<typeof useFinance>; onAdd: ()=>void }) {
  const meta = CAT_META[cat]
  const Icon = meta.icon
  const budget = f.budgets[cat]
  const spent = f.spent[cat]
  const remaining = f.remaining[cat]
  const pct = f.alloc[cat]
  const usePct = budget > 0 ? Math.round((spent/budget)*100) : 0
  const over = spent > budget

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200"><Icon size={18} className={clsx(meta.soft.split(' ')[1], meta.darkSoft)} />{meta.label}</span>
        <span className="chip bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{toFaDigits(pct)}٪</span>
      </div>
      <div>
        <div className="flex items-end justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>سقف: {formatToman(budget)}</span>
          <span className={over ? 'text-rose-500' : ''}>{toFaDigits(usePct)}٪ استفاده</span>
        </div>
        <div className="mt-1.5"><ProgressBar value={spent} max={budget} color={meta.bg} /></div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500">مصرف شده</p>
          <p className="tnum text-base font-bold text-slate-700 dark:text-slate-200">{formatToman(spent)}</p>
        </div>
        <div className="text-left">
          <p className="text-xs text-slate-400 dark:text-slate-500">باقی‌مانده</p>
          <p className={clsx('tnum text-base font-bold', over ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400')}>{formatToman(remaining)}</p>
        </div>
      </div>
      <button onClick={onAdd} className="btn-ghost w-full text-xs"><Plus size={14}/> ثبت {meta.label}</button>
    </div>
  )
}

function IncomeModal({ open, onClose, selYear, selMonth, currentIncome, onSave }: {
  open: boolean; onClose: ()=>void; selYear: number; selMonth: number; currentIncome: number;
  onSave: (income: number, note: string | undefined, incomeDate: string, alloc: AllocPcts) => Promise<void>
}) {
  const today = todayJalaliYMD()
  const [income, setIncome] = useState('')
  const [notev, setNotev] = useState('')
  const [saving, setSaving] = useState(false)
  const [dYear, setDYear] = useState(selYear)
  const [dMonth, setDMonth] = useState(selMonth)
  const [dDay, setDDay] = useState(today.day)
  const [alloc, setAlloc] = useState<AllocPcts>(DEFAULT_ALLOC)

  const [prevOpen, setPrevOpen] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setIncome('')
      setNotev('')
      setAlloc({ ...DEFAULT_ALLOC })
      setDYear(selYear); setDMonth(selMonth); setDDay(today.day)
    }
  }

  const maxDay = jalaliMonthDays(dYear, dMonth)
  const safeDay = Math.min(dDay, maxDay)
  const amt = Number(income.replace(/[^0-9]/g,'')) || 0
  const allocSum = alloc.invest + alloc.expense + alloc.save

  const updateAlloc = (key: keyof AllocPcts, val: number) => {
    const next = { ...alloc, [key]: val }
    const otherKeys = (Object.keys(next) as (keyof AllocPcts)[]).filter(k => k !== key)
    const remaining = 100 - val
    const otherSum = otherKeys.reduce((s,k) => s + next[k], 0)
    if (otherSum > 0) {
      otherKeys.forEach(k => { next[k] = Math.round((next[k] / otherSum) * remaining) })
    } else {
      otherKeys.forEach((k,i) => { next[k] = i === 0 ? remaining : 0 })
    }
    // fix rounding
    const diff = 100 - (next.invest + next.expense + next.save)
    next[otherKeys[0]] += diff
    setAlloc(next)
  }

  const submit = async () => {
    setSaving(true)
    const isoDate = jalaliToISODate(dYear, dMonth, safeDay)
    await onSave(amt, notev || undefined, isoDate, alloc)
    setSaving(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="ثبت درآمد جدید">
      <div className="space-y-4">
        {currentIncome > 0 && (
          <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-700 dark:bg-brand-950/30 dark:text-brand-400">
            <p>درآمد ثبت‌شده تا الان این ماه: <span className="tnum font-bold">{formatToman(currentIncome)}</span></p>
            <p className="mt-1">این مبلغ جدید به درآمد قبلی اضافه می‌شود.</p>
          </div>
        )}
        <div>
          <label className="label">مبلغ درآمد (تومان)</label>
          <input type="text" inputMode="numeric" value={toFaDigits(income)} onChange={e=>setIncome(e.target.value.replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g,''))} className="input tnum text-lg" placeholder="۵۰۰۰۰۰۰" />
        </div>

        <div>
          <label className="label">تاریخ واریز درآمد (شمسی)</label>
          <div className="flex items-center gap-2">
            <select value={dYear} onChange={e=>setDYear(+e.target.value)} className="input w-auto py-2">
              {YEAR_RANGE.map(y => <option key={y} value={y}>{toFaDigits(y)}</option>)}
            </select>
            <select value={dMonth} onChange={e=>{setDMonth(+e.target.value); setDDay(1)}} className="input w-auto py-2">
              {PERSIAN_MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={safeDay} onChange={e=>setDDay(+e.target.value)} className="input w-auto py-2">
              {Array.from({length: maxDay}, (_,i) => i+1).map(d => <option key={d} value={d}>{toFaDigits(d)}</option>)}
            </select>
          </div>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">تاریخ انتخابی: {toFaDigits(dYear)}/{toFaDigits(String(dMonth).padStart(2,'0'))}/{toFaDigits(String(safeDay).padStart(2,'0'))}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <p className="mb-3 text-xs font-semibold text-slate-600 dark:text-slate-300">درصد تخصیص (مجموع باید ۱۰۰٪ باشد)</p>
          <div className="space-y-3">
            <AllocSlider label="سرمایه‌گذاری" value={alloc.invest} color="text-emerald-600 dark:text-emerald-400" onChange={v=>updateAlloc('invest',v)} />
            <AllocSlider label="هزینه‌ها" value={alloc.expense} color="text-rose-600 dark:text-rose-400" onChange={v=>updateAlloc('expense',v)} />
            <AllocSlider label="پس‌انداز" value={alloc.save} color="text-amber-600 dark:text-amber-400" onChange={v=>updateAlloc('save',v)} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400">مجموع:</span>
            <span className={clsx('tnum text-sm font-bold', allocSum === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>{toFaDigits(allocSum)}٪</span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
          <p>پیش‌نمایش تقسیم درآمد:</p>
          <ul className="mt-2 space-y-1">
            <li className="flex justify-between"><span className="text-emerald-600 dark:text-emerald-400">سرمایه‌گذاری ({toFaDigits(alloc.invest)}٪)</span><span className="tnum font-semibold">{formatToman(pctOf(amt, alloc.invest))}</span></li>
            <li className="flex justify-between"><span className="text-rose-600 dark:text-rose-400">هزینه‌ها ({toFaDigits(alloc.expense)}٪)</span><span className="tnum font-semibold">{formatToman(pctOf(amt, alloc.expense))}</span></li>
            <li className="flex justify-between"><span className="text-amber-600 dark:text-amber-400">پس‌انداز ({toFaDigits(alloc.save)}٪)</span><span className="tnum font-semibold">{formatToman(pctOf(amt, alloc.save))}</span></li>
          </ul>
        </div>

        <div>
          <label className="label">یادداشت (اختیاری)</label>
          <input type="text" value={notev} onChange={e=>setNotev(e.target.value)} className="input" placeholder="مثلاً: حقوق فروردین" />
        </div>
        <button onClick={submit} disabled={saving || amt<=0 || allocSum !== 100} className="btn-primary w-full">
          {saving ? 'در حال ذخیره…' : 'ذخیره'}
        </button>
      </div>
    </Modal>
  )
}

function AllocSlider({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number)=>void }) {
  return (
    <div className="flex items-center gap-3">
      <span className={clsx('w-24 text-xs font-medium', color)}>{label}</span>
      <input type="range" min={0} max={100} value={value} onChange={e=>onChange(+e.target.value)} className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-700 accent-brand-600" />
      <input type="number" min={0} max={100} value={value} onChange={e=>onChange(Math.max(0, Math.min(100, +e.target.value)))} className="input tnum w-16 py-1.5 text-center text-sm" />
      <span className="text-xs text-slate-400">٪</span>
    </div>
  )
}

const SUB_TYPES: Record<CatKey, string[]> = {
  invest: ['طلا','صندوق سرمایه‌گذاری','سهام','ارز دیجیتال','سکه','سایر'],
  expense: ['خرج ضروری','خوراک','مسکن','حمل و نقل','سلامت','سایر'],
  save: ['سود مرکب','سپرده بانکی','پس‌انداز نقد','سایر'],
}

function TxModal({ cat, selYear, selMonth, budget, spent, onClose, onAdd }: {
  cat: CatKey; selYear: number; selMonth: number; budget: number; spent: number; onClose: ()=>void;
  onAdd: (amount: number, subType: string, note?: string, date?: string) => Promise<void>
}) {
  const today = todayJalaliYMD()
  const [amount, setAmount] = useState('')
  const [subType, setSubType] = useState(SUB_TYPES[cat][0])
  const [note, setNote] = useState('')
  const [dYear, setDYear] = useState(selYear)
  const [dMonth, setDMonth] = useState(selMonth)
  const [dDay, setDDay] = useState(today.day)
  const [saving, setSaving] = useState(false)
  const meta = CAT_META[cat]
  const remaining = Math.max(0, budget - spent)
  const amt = Number(amount.replace(/[^0-9]/g,'')) || 0
  const over = amt > remaining
  const maxDay = jalaliMonthDays(dYear, dMonth)
  const safeDay = Math.min(dDay, maxDay)

  const submit = async () => {
    if (amt <= 0) return
    setSaving(true)
    const isoDate = jalaliToISODate(dYear, dMonth, safeDay)
    await onAdd(amt, subType, note || undefined, isoDate)
    setSaving(false)
  }

  return (
    <Modal open={true} onClose={onClose} title={`ثبت ${meta.label}`}>
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
          <div className="flex justify-between"><span>سقف {meta.label}</span><span className="tnum font-semibold">{formatToman(budget)}</span></div>
          <div className="flex justify-between"><span>مصرف شده</span><span className="tnum">{formatToman(spent)}</span></div>
          <div className="flex justify-between"><span>باقی‌مانده</span><span className="tnum font-semibold text-emerald-600 dark:text-emerald-400">{formatToman(remaining)}</span></div>
        </div>
        <div>
          <label className="label">مبلغ (تومان)</label>
          <input type="text" inputMode="numeric" value={toFaDigits(amount)} onChange={e=>setAmount(e.target.value.replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g,''))} className="input tnum text-lg" placeholder="۰" />
          {over && <p className="mt-1.5 text-xs text-rose-500">این مبلغ از سقف باقی‌مانده بیشتر است. می‌توانید ثبت کنید اما از سقف فراتر می‌رود.</p>}
        </div>
        <div>
          <label className="label">نوع</label>
          <div className="flex flex-wrap gap-2">
            {SUB_TYPES[cat].map(st => (
              <button key={st} onClick={()=>setSubType(st)} className={clsx('chip transition-all', subType===st ? meta.bg+' text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>{st}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">یادداشت (اختیاری)</label>
          <input type="text" value={note} onChange={e=>setNote(e.target.value)} className="input" placeholder="توضیح بیشتر…" />
        </div>
        <div>
          <label className="label">تاریخ تراکنش (شمسی)</label>
          <div className="flex items-center gap-2">
            <select value={dYear} onChange={e=>setDYear(+e.target.value)} className="input w-auto py-2">
              {YEAR_RANGE.map(y => <option key={y} value={y}>{toFaDigits(y)}</option>)}
            </select>
            <select value={dMonth} onChange={e=>{setDMonth(+e.target.value); setDDay(1)}} className="input w-auto py-2">
              {PERSIAN_MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={safeDay} onChange={e=>setDDay(+e.target.value)} className="input w-auto py-2">
              {Array.from({length: maxDay}, (_,i) => i+1).map(d => <option key={d} value={d}>{toFaDigits(d)}</option>)}
            </select>
          </div>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">تاریخ انتخابی: {toFaDigits(dYear)}/{toFaDigits(String(dMonth).padStart(2,'0'))}/{toFaDigits(String(safeDay).padStart(2,'0'))}</p>
        </div>
        <button onClick={submit} disabled={saving || amt<=0} className="btn-primary w-full">{saving ? 'در حال ذخیره…' : 'ثبت تراکنش'}</button>
      </div>
    </Modal>
  )
}

function SettingsModal({ open, onClose, onExport, monthsCount, txsCount, entriesCount }: {
  open: boolean; onClose: ()=>void; onExport: ()=>void; monthsCount: number; txsCount: number; entriesCount: number
}) {
  return (
    <Modal open={open} onClose={onClose} title="تنظیمات">
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <h4 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">آمار حساب شما</h4>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>تعداد ماه‌های ثبت‌شده:</span>
            <span className="tnum font-semibold">{toFaDigits(monthsCount)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>تعداد ثبت‌های درآمد:</span>
            <span className="tnum font-semibold">{toFaDigits(entriesCount)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>تعداد تراکنش‌ها:</span>
            <span className="tnum font-semibold">{toFaDigits(txsCount)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <FileSpreadsheet size={20} />
            </span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">خروجی اکسل</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">دانلود کلیه ماه‌ها و تراکنش‌ها در یک فایل اکسل</p>
            </div>
          </div>
          <button onClick={onExport} disabled={monthsCount === 0} className="btn-primary mt-3 w-full">
            <FileSpreadsheet size={16} /> دانلود فایل اکسل
          </button>
          {monthsCount === 0 && <p className="mt-2 text-center text-xs text-slate-400">هنوز داده‌ای برای خروجی وجود ندارد.</p>}
        </div>

        <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
          <p className="font-semibold text-slate-600 dark:text-slate-300">هوش دفتر مالی من</p>
          <p className="mt-1">برای تغییر درصد تخصیص هر ماه، از دکمه «ثبت / ویرایش درآمد ماه» استفاده کنید.</p>
        </div>
      </div>
    </Modal>
  )
}

function CompoundCalculator({ currentSave, currentInvest }: { currentSave: number; currentInvest: number }) {
  const [principal, setPrincipal] = useState(String(Math.round(currentSave) || ''))
  const [rate, setRate] = useState('30')
  const [months, setMonths] = useState('12')
  const [goldRate, setGoldRate] = useState('40')
  const [goldPrincipal, setGoldPrincipal] = useState(String(Math.round(currentInvest) || ''))

  const p = Number(principal.replace(/[^0-9]/g,'')) || 0
  const r = Number(rate) || 0
  const m = Number(months) || 0
  const gp = Number(goldPrincipal.replace(/[^0-9]/g,'')) || 0
  const gr = Number(goldRate) || 0

  const saveFuture = compoundInterest(p, r, m)
  const goldFuture = compoundInterest(gp, gr, m)
  const saveProfit = saveFuture - p
  const goldProfit = goldFuture - gp

  const numInput = (v: string, set: (s:string)=>void) => set(v.replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g,''))

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label text-xs">اصل پس‌انداز (تومان)</label>
          <input className="input tnum" value={toFaDigits(principal)} onChange={e=>numInput(e.target.value,setPrincipal)} />
        </div>
        <div>
          <label className="label text-xs">نرخ سود سالانه (٪)</label>
          <input className="input tnum" value={toFaDigits(rate)} onChange={e=>numInput(e.target.value,setRate)} />
        </div>
        <div>
          <label className="label text-xs">مدت (ماه)</label>
          <input className="input tnum" value={toFaDigits(months)} onChange={e=>numInput(e.target.value,setMonths)} />
        </div>
        <div className="flex items-end">
          <div className="w-full rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
            <p className="text-xs text-amber-600 dark:text-amber-400">ارزش آینده پس‌انداز</p>
            <p className="tnum text-lg font-bold text-amber-700 dark:text-amber-300">{formatToman(saveFuture)}</p>
            <p className="text-xs text-amber-500 dark:text-amber-500">سود: {formatToman(saveProfit)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div>
          <label className="label text-xs">اصل سرمایه‌گذاری طلا (تومان)</label>
          <input className="input tnum" value={toFaDigits(goldPrincipal)} onChange={e=>numInput(e.target.value,setGoldPrincipal)} />
        </div>
        <div>
          <label className="label text-xs">رشد سالانه طلا (٪)</label>
          <input className="input tnum" value={toFaDigits(goldRate)} onChange={e=>numInput(e.target.value,setGoldRate)} />
        </div>
        <div className="flex items-end">
          <div className="w-full rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">ارزش آینده سرمایه‌گذاری طلا</p>
            <p className="tnum text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatToman(goldFuture)}</p>
            <p className="text-xs text-emerald-500 dark:text-emerald-500">سود: {formatToman(goldProfit)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
