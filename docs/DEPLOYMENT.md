# دليل نشر التطبيق (Deployment Guide)

هذا الدليل يشرح كيفية نشر تطبيق **"حروفي وكلماتي"** في بيئات الإنتاج المختلفة.

---

## 1. النشر عبر Google Cloud Run

بما أن التطبيق مبني داخل بيئة **AI Studio Build**، فإن أسهل طريقة هي استخدام التكامل المدمج.

### الطريقة الأولى: النشر المباشر من AI Studio
1. في واجهة **AI Studio**، اضغط على زر **"Share"** أو **"Deploy"** في الزاوية العلوية اليمنى.
2. اختر **"Cloud Run"** كوجهة للنشر.
3. سيقوم النظام تلقائياً ببناء حاوية (Docker Container) ونشرها على خوادم Google Cloud.
4. ستحصل على رابط ثابت (URL) ينتهي بـ `.run.app`.

### الطريقة الثانية: النشر اليدوي (Manual)
إذا أردت النشر من جهازك الخاص:
1. تأكد من تثبيت **Google Cloud CLI** و **Docker**.
2. قم ببناء التطبيق: `npm run build`.
3. أنشئ ملف `Dockerfile` (إذا لم يكن موجوداً) لاستضافة الملفات الثابتة (Static Files) باستخدام Nginx أو أي خادم ويب.
4. ارفع الصورة إلى **Artifact Registry**:
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT_ID]/my-app
   ```
5. انشر الحاوية:
   ```bash
   gcloud run deploy --image gcr.io/[PROJECT_ID]/my-app --platform managed
   ```

---

## 2. النشر عبر GitHub و Vercel (أو المنصات المشابهة)

*ملاحظة: نفترض أن "verbal" في طلبك تشير إلى منصة **Vercel** الشهيرة لنشر تطبيقات React.*

### الخطوة الأولى: رفع الكود إلى GitHub
1. في **AI Studio**، اذهب إلى الإعدادات (Settings) واختر **"Export to GitHub"**.
2. اربط حسابك في GitHub وقم بإنشاء مستودع (Repository) جديد.
3. سيتم رفع جميع ملفات المشروع تلقائياً.

### الخطوة الثانية: الربط مع Vercel
1. اذهب إلى [Vercel.com](https://vercel.com) وسجل دخولك باستخدام حساب GitHub.
2. اضغط على **"Add New Project"**.
3. اختر المستودع الذي قمت برفعه من القائمة.
4. في إعدادات البناء (Build Settings)، سيتعرف Vercel تلقائياً على أنه مشروع **Vite**:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. اضغط على **"Deploy"**.

### النشر عبر GitHub Pages (بديل مجاني)
إذا كنت تفضل استخدام GitHub Pages مباشرة:
1. ثبت حزمة النشر: `npm install -D gh-pages`.
2. أضف السكربتات التالية لملف `package.json`:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. نفذ الأمر: `npm run deploy`.

---

## ملاحظات هامة
- **البيئة (Environment):** تأكد من ضبط متغيرات البيئة (مثل مفاتيح API إن وجدت) في لوحة تحكم Cloud Run أو Vercel.
- **المسارات (Routes):** بما أن التطبيق هو Single Page Application (SPA)، تأكد من ضبط خادم الويب ليعيد توجيه جميع المسارات إلى `index.html` لتجنب أخطاء 404 عند تحديث الصفحة.
