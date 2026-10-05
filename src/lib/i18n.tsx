import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Lang = 'fa' | 'en'

type Dict = Record<string, string>

const fa: Dict = {
  // App
  'app.title': 'حسابینو AI',
  'app.subtitle': 'مدیریت درآمد، هزینه، پس‌انداز و سرمایه‌گذاری',

  // Auth
  'auth.signin': 'ورود',
  'auth.signup': 'ثبت‌نام',
  'auth.email': 'ایمیل',
  'auth.password': 'رمز عبور',
  'auth.signinBtn': 'ورود به حساب',
  'auth.signupBtn': 'ساخت حساب',
  'auth.loading': 'لطفاً صبر کنید…',
  'auth.forgot': 'رمز عبور را فراموش کرده‌اید؟',
  'auth.forgotTitle': 'بازیابی رمز عبور',
  'auth.forgotBtn': 'ارسال لینک بازیابی',
  'auth.forgotSuccess': 'لینک بازیابی رمز به ایمیل شما ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.',
  'auth.forgotBack': 'بازگشت به ورود',
  'auth.privacy': 'اطلاعات شما کاملاً شخصی و امن است و فقط روی حساب شما قابل مشاهده است.',
  'auth.errInvalid': 'ایمیل یا رمز عبور اشتباه است',
  'auth.errExists': 'این ایمیل قبلاً ثبت شده است',
  'auth.errGeneric': 'خطایی رخ داد',
  'auth.pwdPlaceholder': 'حداقل ۶ کاراکتر',
  'auth.pwdMin': 'رمز عبور باید حداقل ۶ کاراکتر باشد',

  // Dashboard header
  'dash.logout': 'خروج',
  'dash.settings': 'تنظیمات',
  'dash.darkMode': 'حالت تاریک',
  'dash.lightMode': 'حالت روشن',

  // Dashboard main
  'dash.title': 'داشبورد ماهانه',
  'dash.desc': 'درآمد خود را ثبت کنید تا به‌صورت خودکار بر اساس درصد انتخابی تقسیم شود',
  'dash.monthIncome': 'درآمد ماه',
  'dash.netWorth': 'سرمایه خالص',
  'dash.totalExpense': 'کل هزینه‌ها',
  'dash.totalSave': 'کل پس‌انداز',
  'dash.cumulative': 'تجمعی',
  'dash.cumulativeAll': 'تجمعی همه ماه‌ها',
  'dash.addIncome': 'ثبت درآمد جدید',
  'dash.deleteMonth': 'حذف ماه',

  // Empty state
  'dash.emptyTitle': 'برای شروع، درآمد این ماه را ثبت کنید',
  'dash.emptyDesc': 'پس از ثبت درآمد، مبلغ به‌صورت خودکار بر اساس درصد انتخابی شما تقسیم می‌شود.',

  // Allocation
  'dash.allocation': 'تخصیص درآمد',
  'dash.invest': 'سرمایه‌گذاری',
  'dash.expense': 'هزینه‌ها',
  'dash.save': 'پس‌انداز',

  // Budget cards
  'budget.budget': 'سقف',
  'budget.used': 'استفاده',
  'budget.spent': 'مصرف شده',
  'budget.remaining': 'باقی‌مانده',
  'budget.addTx': 'ثبت',

  // Income entries
  'income.title': 'ثبت‌های درآمد',
  'income.empty': 'هنوز درآمدی ثبت نشده است.',
  'income.allocInvest': 'سرمایه',
  'income.allocExpense': 'هزینه',
  'income.allocSave': 'پس‌انداز',

  // Transactions
  'tx.title': 'تراکنش‌های',
  'tx.empty': 'هنوز تراکنشی ثبت نشده است. از کارت‌های بالا تراکنش اضافه کنید.',

  // Charts
  'chart.trend': 'روند ۶ ماه اخیر',
  'chart.netGrowth': 'رشد خالص سرمایه (تجمعی)',
  'chart.value': 'ارزش',
  'chart.compound': 'محاسبه سود مرکب و سرمایه‌گذاری طلا',
  'chart.compoundDesc': 'پیش‌بینی رشد پس‌انداز و سرمایه‌گذاری طلا در آینده',

  // Income modal
  'modal.incomeTitle': 'ثبت درآمد جدید',
  'modal.currentIncome': 'درآمد ثبت‌شده تا الان این ماه',
  'modal.addNote': 'این مبلغ جدید به درآمد قبلی اضافه می‌شود.',
  'modal.amount': 'مبلغ درآمد (تومان)',
  'modal.incomeDate': 'تاریخ واریز درآمد (شمسی)',
  'modal.allocTitle': 'درصد تخصیص (مجموع باید ۱۰۰٪ باشد)',
  'modal.total': 'مجموع',
  'modal.preview': 'پیش‌نمایش تقسیم درآمد',
  'modal.note': 'یادداشت (اختیاری)',
  'modal.notePlaceholder': 'مثلاً: حقوق فروردین',
  'modal.save': 'ذخیره',
  'modal.saving': 'در حال ذخیره…',
  'modal.selectedDate': 'تاریخ انتخابی',

  // Tx modal
  'modal.txTitle': 'ثبت',
  'modal.txBudget': 'سقف',
  'modal.txSpent': 'مصرف شده',
  'modal.txRemaining': 'باقی‌مانده',
  'modal.txAmount': 'مبلغ (تومان)',
  'modal.txOver': 'این مبلغ از سقف باقی‌مانده بیشتر است. می‌توانید ثبت کنید اما از سقف فراتر می‌رود.',
  'modal.txType': 'نوع',
  'modal.txNotePlaceholder': 'توضیح بیشتر…',
  'modal.txDate': 'تاریخ تراکنش (شمسی)',
  'modal.txSave': 'ثبت تراکنش',

  // Settings
  'settings.title': 'تنظیمات',
  'settings.stats': 'آمار حساب شما',
  'settings.months': 'تعداد ماه‌های ثبت‌شده',
  'settings.entries': 'تعداد ثبت‌های درآمد',
  'settings.txs': 'تعداد تراکنش‌ها',
  'settings.export': 'خروجی اکسل',
  'settings.exportDesc': 'دانلود کلیه ماه‌ها و تراکنش‌ها در یک فایل اکسل',
  'settings.exportBtn': 'دانلود فایل اکسل',
  'settings.exportEmpty': 'هنوز داده‌ای برای خروجی وجود ندارد.',
  'settings.language': 'زبان',
  'settings.languageDesc': 'تغییر زبان برنامه بین فارسی و انگلیسی',
  'settings.changePwd': 'تغییر رمز عبور',
  'settings.changePwdDesc': 'رمز عبور حساب خود را تغییر دهید',
  'settings.newPwd': 'رمز عبور جدید',
  'settings.newPwdConfirm': 'تکرار رمز عبور جدید',
  'settings.changePwdBtn': 'تغییر رمز',
  'settings.pwdSuccess': 'رمز عبور با موفقیت تغییر کرد.',
  'settings.pwdMismatch': 'رمز عبور و تکرار آن یکسان نیستند.',
  'settings.pwdError': 'خطا در تغییر رمز عبور. لطفاً دوباره تلاش کنید.',
  'settings.about': 'حسابینو AI',
  'settings.aboutDesc': 'برای تغییر درصد تخصیص هر ماه، از دکمه «ثبت درآمد جدید» استفاده کنید.',

  // Compound calculator
  'calc.principal': 'اصل پس‌انداز (تومان)',
  'calc.rate': 'نرخ سود سالانه (٪)',
  'calc.duration': 'مدت (ماه)',
  'calc.futureSave': 'ارزش آینده پس‌انداز',
  'calc.profit': 'سود',
  'calc.goldPrincipal': 'اصل سرمایه‌گذاری طلا (تومان)',
  'calc.goldRate': 'رشد سالانه طلا (٪)',
  'calc.futureGold': 'ارزش آینده سرمایه‌گذاری طلا',
}

const en: Dict = {
  'app.title': 'Hesabino AI',
  'app.subtitle': 'Manage income, expenses, savings and investments',

  'auth.signin': 'Sign In',
  'auth.signup': 'Sign Up',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.signinBtn': 'Sign In',
  'auth.signupBtn': 'Create Account',
  'auth.loading': 'Please wait…',
  'auth.forgot': 'Forgot your password?',
  'auth.forgotTitle': 'Reset Password',
  'auth.forgotBtn': 'Send Reset Link',
  'auth.forgotSuccess': 'A password reset link has been sent to your email. Please check your inbox.',
  'auth.forgotBack': 'Back to Sign In',
  'auth.privacy': 'Your data is completely private and secure, visible only to you.',
  'auth.errInvalid': 'Invalid email or password',
  'auth.errExists': 'This email is already registered',
  'auth.errGeneric': 'An error occurred',
  'auth.pwdPlaceholder': 'At least 6 characters',
  'auth.pwdMin': 'Password must be at least 6 characters',

  'dash.logout': 'Logout',
  'dash.settings': 'Settings',
  'dash.darkMode': 'Dark Mode',
  'dash.lightMode': 'Light Mode',

  'dash.title': 'Monthly Dashboard',
  'dash.desc': 'Register your income to auto-distribute based on your allocation',
  'dash.monthIncome': 'Monthly Income',
  'dash.netWorth': 'Net Worth',
  'dash.totalExpense': 'Total Expenses',
  'dash.totalSave': 'Total Savings',
  'dash.cumulative': 'Cumulative',
  'dash.cumulativeAll': 'All months cumulative',
  'dash.addIncome': 'Add New Income',
  'dash.deleteMonth': 'Delete Month',

  'dash.emptyTitle': 'Register this month\'s income to get started',
  'dash.emptyDesc': 'After registering income, the amount is automatically distributed based on your selected percentages.',

  'dash.allocation': 'Income Allocation',
  'dash.invest': 'Investment',
  'dash.expense': 'Expenses',
  'dash.save': 'Savings',

  'budget.budget': 'Budget',
  'budget.used': 'used',
  'budget.spent': 'Spent',
  'budget.remaining': 'Remaining',
  'budget.addTx': 'Add',

  'income.title': 'Income Entries',
  'income.empty': 'No income registered yet.',
  'income.allocInvest': 'Invest',
  'income.allocExpense': 'Expense',
  'income.allocSave': 'Save',

  'tx.title': 'Transactions',
  'tx.empty': 'No transactions yet. Add one from the cards above.',

  'chart.trend': 'Last 6 Months Trend',
  'chart.netGrowth': 'Net Worth Growth (Cumulative)',
  'chart.value': 'Value',
  'chart.compound': 'Compound Interest & Gold Investment Calculator',
  'chart.compoundDesc': 'Forecast savings and gold investment growth in the future',

  'modal.incomeTitle': 'Add New Income',
  'modal.currentIncome': 'Income registered so far this month',
  'modal.addNote': 'This new amount will be added to existing income.',
  'modal.amount': 'Income Amount (Toman)',
  'modal.incomeDate': 'Income Date (Solar)',
  'modal.allocTitle': 'Allocation Percent (must total 100%)',
  'modal.total': 'Total',
  'modal.preview': 'Income Distribution Preview',
  'modal.note': 'Note (optional)',
  'modal.notePlaceholder': 'e.g. April salary',
  'modal.save': 'Save',
  'modal.saving': 'Saving…',
  'modal.selectedDate': 'Selected date',

  'modal.txTitle': 'Add',
  'modal.txBudget': 'Budget',
  'modal.txSpent': 'Spent',
  'modal.txRemaining': 'Remaining',
  'modal.txAmount': 'Amount (Toman)',
  'modal.txOver': 'This amount exceeds the remaining budget. You can still register it.',
  'modal.txType': 'Type',
  'modal.txNotePlaceholder': 'More details…',
  'modal.txDate': 'Transaction Date (Solar)',
  'modal.txSave': 'Add Transaction',

  'settings.title': 'Settings',
  'settings.stats': 'Account Statistics',
  'settings.months': 'Registered months',
  'settings.entries': 'Income entries',
  'settings.txs': 'Transactions',
  'settings.export': 'Excel Export',
  'settings.exportDesc': 'Download all months and transactions in an Excel file',
  'settings.exportBtn': 'Download Excel',
  'settings.exportEmpty': 'No data to export yet.',
  'settings.language': 'Language',
  'settings.languageDesc': 'Switch app language between Persian and English',
  'settings.changePwd': 'Change Password',
  'settings.changePwdDesc': 'Change your account password',
  'settings.newPwd': 'New Password',
  'settings.newPwdConfirm': 'Confirm New Password',
  'settings.changePwdBtn': 'Change Password',
  'settings.pwdSuccess': 'Password changed successfully.',
  'settings.pwdMismatch': 'Passwords do not match.',
  'settings.pwdError': 'Error changing password. Please try again.',
  'settings.about': 'Hesabino AI',
  'settings.aboutDesc': 'Use "Add New Income" to change allocation percentages each month.',

  'calc.principal': 'Savings Principal (Toman)',
  'calc.rate': 'Annual Interest Rate (%)',
  'calc.duration': 'Duration (months)',
  'calc.futureSave': 'Future Savings Value',
  'calc.profit': 'Profit',
  'calc.goldPrincipal': 'Gold Investment Principal (Toman)',
  'calc.goldRate': 'Annual Gold Growth (%)',
  'calc.futureGold': 'Future Gold Investment Value',
}

const dicts: Record<Lang, Dict> = { fa, en }

type I18nCtx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const Ctx = createContext<I18nCtx>({ lang: 'fa', setLang: () => {}, t: (k) => k })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    return saved === 'en' ? 'en' : 'fa'
  })

  useEffect(() => {
    localStorage.setItem('lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)
  const t = (key: string) => dicts[lang][key] ?? key

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useI18n() { return useContext(Ctx) }
