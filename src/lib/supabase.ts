import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type MonthRow = {
  id: string
  user_id: string
  year: number
  month: number
  income: number
  income_date: string | null
  note: string | null
  alloc_invest: number
  alloc_expense: number
  alloc_save: number
  created_at: string
}

export type IncomeEntry = {
  id: string
  user_id: string
  month_id: string
  amount: number
  income_date: string
  note: string | null
  alloc_invest: number
  alloc_expense: number
  alloc_save: number
  created_at: string
}

export type TxCategory = 'expense' | 'invest' | 'save'

export type TxRow = {
  id: string
  user_id: string
  month_id: string
  category: TxCategory
  sub_type: string | null
  amount: number
  note: string | null
  date: string
  created_at: string
}
