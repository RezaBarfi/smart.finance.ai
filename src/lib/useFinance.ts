import { useCallback, useEffect, useState } from 'react'
import { supabase, MonthRow, TxRow, TxCategory, IncomeEntry } from './supabase'
import { todayJalaliYM, todayJalaliYMD, jalaliToISODate } from './format'

export const DEFAULT_ALLOC = { invest: 40, expense: 30, save: 30 } as const

export type AllocPcts = { invest: number; expense: number; save: number }

export function useFinance() {
  const { year: curYear, month: curMonth } = todayJalaliYM()
  const [selYear, setSelYear] = useState(curYear)
  const [selMonth, setSelMonth] = useState(curMonth)
  const [months, setMonths] = useState<MonthRow[]>([])
  const [txs, setTxs] = useState<TxRow[]>([])
  const [entries, setEntries] = useState<IncomeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const current = months.find(m => m.year === selYear && m.month === selMonth) ?? null

  const load = useCallback(async () => {
    if (!initialized) setLoading(true)
    const { data: mData } = await supabase.from('months').select('*').order('year', { ascending: false }).order('month', { ascending: false })
    const monthsData = (mData as MonthRow[]) ?? []
    setMonths(monthsData)

    const cur = monthsData.find(m => m.year === selYear && m.month === selMonth) ?? null
    if (cur) {
      const [txRes, entryRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('month_id', cur.id).order('date', { ascending: false }),
        supabase.from('income_entries').select('*').eq('month_id', cur.id).order('created_at', { ascending: false }),
      ])
      setTxs((txRes.data as TxRow[]) ?? [])
      setEntries((entryRes.data as IncomeEntry[]) ?? [])
    } else {
      setTxs([])
      setEntries([])
    }
    setLoading(false)
    setInitialized(true)
  }, [selYear, selMonth, initialized])

  useEffect(() => { load() }, [load])

  // محاسبه درآمد کل و سقف‌ها از مجموع همه ثبت‌های درآمد
  const totalIncome = entries.reduce((s, e) => s + Number(e.amount), 0)
  const budgets = {
    invest: entries.reduce((s, e) => s + (Number(e.amount) * e.alloc_invest) / 100, 0),
    expense: entries.reduce((s, e) => s + (Number(e.amount) * e.alloc_expense) / 100, 0),
    save: entries.reduce((s, e) => s + (Number(e.amount) * e.alloc_save) / 100, 0),
  }

  // درصد موزون (نمایشی) برای نمایش در کارت‌ها
  const alloc: AllocPcts = totalIncome > 0
    ? {
        invest: Math.round((budgets.invest / totalIncome) * 100),
        expense: Math.round((budgets.expense / totalIncome) * 100),
        save: 100 - Math.round((budgets.invest / totalIncome) * 100) - Math.round((budgets.expense / totalIncome) * 100),
      }
    : { ...DEFAULT_ALLOC }

  const addIncomeEntry = async (amount: number, incomeDate: string, note: string | undefined, allocPcts: AllocPcts) => {
    // اگر ماه هنوز وجود ندارد، اول آن را بساز
    let monthId = current?.id
    if (!monthId) {
      const { data: newMonth } = await supabase.from('months').insert({
        year: selYear, month: selMonth, income: 0,
      }).select().single()
      monthId = (newMonth as MonthRow)?.id
    }
    if (!monthId) return
    await supabase.from('income_entries').insert({
      month_id: monthId, amount, income_date: incomeDate, note: note ?? null,
      alloc_invest: allocPcts.invest, alloc_expense: allocPcts.expense, alloc_save: allocPcts.save,
    })
    await load()
  }

  const deleteIncomeEntry = async (id: string) => {
    await supabase.from('income_entries').delete().eq('id', id)
    await load()
  }

  const addTx = async (category: TxCategory, amount: number, subType: string, note?: string, date?: string) => {
    if (!current) return
    await supabase.from('transactions').insert({
      month_id: current.id, category, sub_type: subType, amount, note: note ?? null, date: date ?? new Date().toISOString().slice(0,10),
    })
    await load()
  }

  const deleteTx = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    await load()
  }

  const deleteMonth = async (id: string) => {
    await supabase.from('months').delete().eq('id', id)
    await load()
  }

  const spent = {
    invest: txs.filter(t => t.category === 'invest').reduce((s,t) => s + Number(t.amount), 0),
    expense: txs.filter(t => t.category === 'expense').reduce((s,t) => s + Number(t.amount), 0),
    save: txs.filter(t => t.category === 'save').reduce((s,t) => s + Number(t.amount), 0),
  }
  const remaining = {
    invest: Math.max(0, budgets.invest - spent.invest),
    expense: Math.max(0, budgets.expense - spent.expense),
    save: Math.max(0, budgets.save - spent.save),
  }

  return {
    selYear, selMonth, setSelYear, setSelMonth,
    months, txs, entries, current, loading, alloc,
    income: totalIncome, budgets, spent, remaining,
    addIncomeEntry, deleteIncomeEntry, addTx, deleteTx, deleteMonth, reload: load,
  }
}

export function aggregateTotals(months: MonthRow[], allTxs: TxRow[]) {
  const totalIncome = months.reduce((s,m) => s + Number(m.income), 0)
  const totalInvest = allTxs.filter(t => t.category === 'invest').reduce((s,t) => s + Number(t.amount), 0)
  const totalExpense = allTxs.filter(t => t.category === 'expense').reduce((s,t) => s + Number(t.amount), 0)
  const totalSave = allTxs.filter(t => t.category === 'save').reduce((s,t) => s + Number(t.amount), 0)
  const netWorth = totalInvest + totalSave
  return { totalIncome, totalInvest, totalExpense, totalSave, netWorth }
}
