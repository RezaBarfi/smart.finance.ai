// کمک‌توابع: قالب‌بندی و محاسبات مالی به تومان
import { toJalaali as jToJalaali, toGregorian as jToGregorian, jalaaliMonthLength as jMonthLength } from 'jalaali-js'

export const PERSIAN_MONTHS = [
  'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
  'مهر','آبان','آذر','دی','بهمن','اسفند',
]

// تبدیل ارقام انگلیسی به فارسی
export function toFaDigits(s: string | number): string {
  const fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹']
  return String(s).replace(/[0-9]/g, d => fa[+d])
}

// قالب‌بندی مبلغ تومان با جداکننده هزارگان فارسی
export function formatToman(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '۰'
  const rounded = Math.round(Number(n))
  return toFaDigits(rounded.toLocaleString('en-US'))
}

// قالب‌بندی مبلغ با پسوند «تومان»
export function toman(n: number | null | undefined): string {
  return `${formatToman(n)} تومان`
}

// تبدیل تاریخ میلادی به شمسی با استفاده از jalaali-js
export function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const { jy, jm, jd } = jToJalaali(gy, gm, gd)
  return [jy, jm, jd]
}

// تبدیل تاریخ شمسی به میلادی
export function toGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const { gy, gm, gd } = jToGregorian(jy, jm, jd)
  return [gy, gm, gd]
}

// تاریخ امروز شمسی به صورت yyyy/mm/dd فارسی
export function todayJalali(): string {
  const now = new Date()
  const [jy, jm, jd] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  return `${toFaDigits(jy)}/${toFaDigits(String(jm).padStart(2,'0'))}/${toFaDigits(String(jd).padStart(2,'0'))}`
}

// سال و ماه شمسی امروز
export function todayJalaliYM(): { year: number; month: number } {
  const now = new Date()
  const [jy, jm] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  return { year: jy, month: jm }
}

// تاریخ امروز شمسی به صورت {year, month, day}
export function todayJalaliYMD(): { year: number; month: number; day: number } {
  const now = new Date()
  const [jy, jm, jd] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  return { year: jy, month: jm, day: jd }
}

// تبدیل تاریخ شمسی (year, month, day) به رشته میلادی yyyy-mm-dd برای ذخیره در دیتابیس
export function jalaliToISODate(jy: number, jm: number, jd: number): string {
  const [gy, gm, gd] = toGregorian(jy, jm, jd)
  return `${gy}-${String(gm).padStart(2,'0')}-${String(gd).padStart(2,'0')}`
}

// تبدیل رشته میلادی yyyy-mm-dd به نمایش شمسی فارسی yyyy/mm/dd
export function gregorianToJalaliString(iso: string): string {
  const [gy, gm, gd] = iso.split('-').map(Number)
  const [jy, jm, jd] = toJalali(gy, gm, gd)
  return `${toFaDigits(jy)}/${toFaDigits(String(jm).padStart(2,'0'))}/${toFaDigits(String(jd).padStart(2,'0'))}`
}

// تعداد روزهای هر ماه شمسی
export function jalaliMonthDays(jy: number, jm: number): number {
  return jMonthLength(jy, jm)
}

// تبدیل سال و ماه شمسی به برچسب فارسی
export function monthLabel(year: number, month: number): string {
  return `${PERSIAN_MONTHS[month - 1]} ${toFaDigits(year)}`
}

// محاسبه سود مرکب ماهانه
// principal: اصل سرمایه, annualRatePct: نرخ سالانه (درصد), months: تعداد ماه
export function compoundInterest(principal: number, annualRatePct: number, months: number): number {
  const ratePerPeriod = annualRatePct / 100 / 12
  return principal * Math.pow(1 + ratePerPeriod, months)
}

// ارزش آینده سرمایه‌گذاری طلا با فرض رشد سالانه
export function goldFutureValue(principal: number, annualGrowthPct: number, months: number): number {
  return compoundInterest(principal, annualGrowthPct, months)
}

// درصد از یک عدد
export function pctOf(amount: number, percent: number): number {
  return (amount * percent) / 100
}

export function clamp(n: number, max: number): number {
  return Math.max(0, Math.min(n, max))
}
