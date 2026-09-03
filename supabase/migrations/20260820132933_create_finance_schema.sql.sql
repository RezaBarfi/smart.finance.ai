/*
# ساختار پایگاه داده اپلیکیشن هوش مالی

1. جداول جدید
- `months` (دوره‌های ماهانه): هر کاربر درآمد ماهانه خود را ثبت می‌کند.
  - `id`, `user_id`, `year`, `month` (1-12), `income` (مبلغ درآمد به تومان),
  - `note`, `created_at`
  - محدودیت یکتا روی (user_id, year, month) تا هر کاربر فقط یک رکورد برای هر ماه داشته باشد.
- `transactions` (تراکنش‌ها): هر خرج/سرمایه‌گذاری/پس‌انداز ثبت می‌شود.
  - `id`, `user_id`, `month_id` (FK به months), `category` (expense|invest|save),
  - `sub_type` (مثل: ضروری، طلا، سود مرکب و غیره - متن آزاد),
  - `amount`, `note`, `date`, `created_at`

2. امنیت
- RLS روی هر دو جدول فعال می‌شود.
- سیاست‌های owner-scoped (TO authenticated) با auth.uid() = user_id برای هر چهار عملیات.
- ستون user_id در هر دو جدول DEFAULT auth.uid() دارد تا درج بدون ارسال user_id کار کند.

3. نکات
- مبلغ‌ها به تومان و numeric هستند تا دقت بالا برود.
- month_id در transactions با ON DELETE CASCADE تا با حذف ماه، تراکنش‌ها هم حذف شوند.
- ایندکس روی user_id و month_id برای کارایی.
*/

CREATE TABLE IF NOT EXISTS months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL CHECK (month >= 1 AND month <= 12),
  income numeric(18,2) NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);

ALTER TABLE months ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_months_user ON months(user_id, year, month);

DROP POLICY IF EXISTS "select_own_months" ON months;
CREATE POLICY "select_own_months" ON months FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_months" ON months;
CREATE POLICY "insert_own_months" ON months FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_months" ON months;
CREATE POLICY "update_own_months" ON months FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_months" ON months;
CREATE POLICY "delete_own_months" ON months FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  month_id uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('expense','invest','save')),
  sub_type text,
  amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  note text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_month ON transactions(month_id);
CREATE INDEX IF NOT EXISTS idx_tx_cat ON transactions(category);

DROP POLICY IF EXISTS "select_own_tx" ON transactions;
CREATE POLICY "select_own_tx" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tx" ON transactions;
CREATE POLICY "insert_own_tx" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tx" ON transactions;
CREATE POLICY "update_own_tx" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tx" ON transactions;
CREATE POLICY "delete_own_tx" ON transactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
