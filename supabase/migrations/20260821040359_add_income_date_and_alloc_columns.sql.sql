/*
# افزودن ستون‌های تاریخ درآمد و درصد تخصیص قابل تنظیم

1. تغییرات جدول months
- `income_date` (date): تاریخ واریز درآمد (شمسی در رابط کاربری، میلادی در دیتابیس)
- `alloc_invest` (int, پیش‌فرض 40): درصد سرمایه‌گذاری
- `alloc_expense` (int, پیش‌فرض 30): درصد هزینه‌ها
- `alloc_save` (int, پیش‌فرض 30): درصد پس‌انداز

2. امنیت
- تغییرات فقط ستون جدید اضافه می‌کنند، سیاست‌های RLS موجود بدون تغییر باقی می‌مانند.

3. نکات
- ستون‌ها با DEFAULT و nullable هستند تا رکوردهای قبلی بدون مشکل کار کنند.
- مقادیر پیش‌فرض 40/30/30 است تا رفتار فعلی حفظ شود.
*/

ALTER TABLE months ADD COLUMN IF NOT EXISTS income_date date;
ALTER TABLE months ADD COLUMN IF NOT EXISTS alloc_invest int NOT NULL DEFAULT 40;
ALTER TABLE months ADD COLUMN IF NOT EXISTS alloc_expense int NOT NULL DEFAULT 30;
ALTER TABLE months ADD COLUMN IF NOT EXISTS alloc_save int NOT NULL DEFAULT 30;
