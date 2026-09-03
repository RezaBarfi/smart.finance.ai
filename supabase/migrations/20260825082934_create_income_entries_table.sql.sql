/*
# جدول ثبت‌های درآمد (income_entries)
هر بار که کاربر درآمدی ثبت می‌کند، یک ردیف جدید اضافه می‌شود (جمع‌پذیر).
هر ثبت دارای مبلغ، تاریخ، یادداشت و درصد تخصیص اختصاصی خود است.
سقف هر بخش = مجموع (مبلغ × درصد آن بخش) روی همه ثبت‌های آن ماه.
*/

CREATE TABLE IF NOT EXISTS income_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  month_id uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  income_date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  alloc_invest int NOT NULL DEFAULT 40,
  alloc_expense int NOT NULL DEFAULT 30,
  alloc_save int NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_income_entries_month ON income_entries(month_id);
CREATE INDEX IF NOT EXISTS idx_income_entries_user ON income_entries(user_id);

DROP POLICY IF EXISTS "select_own_income_entries" ON income_entries;
CREATE POLICY "select_own_income_entries" ON income_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_income_entries" ON income_entries;
CREATE POLICY "insert_own_income_entries" ON income_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_income_entries" ON income_entries;
CREATE POLICY "update_own_income_entries" ON income_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_income_entries" ON income_entries;
CREATE POLICY "delete_own_income_entries" ON income_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
