import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { loginUserApi } from '../lib/api';
import { validateLogin } from '../lib/orderRules';
import type { FollowerOrder, UserProfile } from '../lib/types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile, orders: FollowerOrder[]) => void;
  onOpenAdmin: () => void;
}

export function LoginScreen({ onLoginSuccess, onOpenAdmin }: LoginScreenProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateLogin({ fullName, phone, password });

    if (!result.valid || !result.fullName || !result.phone || !result.normalizedPhone) {
      setError(result.error ?? 'يرجى التحقق من البيانات المدخلة.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await loginUserApi({
        fullName: result.fullName,
        phone: result.phone,
        password,
      });
      onLoginSuccess(response.user, response.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          <span className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            طلب الفلوس
          </span>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="min-h-[40px] px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
          >
            الطلبات الواردة
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center py-8 sm:py-12 px-4 sm:px-6">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                تسجيل الدخول
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mb-6 leading-relaxed">
                أدخل اسمك الكامل ورقم هاتفك وكلمة المرور للدخول وطلب الفولورز المغربي أو اللايكات.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-slate-800 mb-1.5"
                  >
                    الاسم الكامل
                  </label>
                  <div className="relative">
                    <User
                      className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="مثال: أمين بنعلي"
                      className="w-full min-h-[46px] pr-10 pl-4 py-2.5 text-sm sm:text-base text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-slate-800 mb-1.5"
                  >
                    رقم الهاتف
                  </label>
                  <div className="relative">
                    <Phone
                      className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="0612345678"
                      className="w-full min-h-[46px] pr-10 pl-4 py-2.5 text-sm sm:text-base text-right text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-colors tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-800 mb-1.5"
                  >
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="أدخل كلمة المرور"
                      className="w-full min-h-[46px] pr-10 pl-12 py-2.5 text-sm sm:text-base text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'
                      }
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 p-3.5 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <AlertCircle
                      className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] px-6 py-3 text-sm sm:text-base font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 active:scale-[0.99] rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck
                className="w-4 h-4 text-emerald-700 shrink-0"
                aria-hidden="true"
              />
              <span>آمن تماماً · لا نطلب أي معلومات بنكية أو بطاقات دفع.</span>
            </div>
          </section>

          <aside className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-800 mb-2">
                خدمة موثوقة ومباشرة
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                اطلب الفولورز المغربي واللايكات بسهولة وأمان
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8">
                صُمم تطبيق طلب الفلوس ليمنحك تجربة سريعة وواضحة من الهاتف أو الحاسوب مع متابعة دقيقة لحدك اليومي وسجل طلباتك.
              </p>

              <dl className="divide-y divide-slate-200 border-t border-b border-slate-200">
                <div className="py-4 flex items-baseline justify-between gap-4">
                  <dt className="text-sm font-medium text-slate-700">
                    حد الفولورز المغربي
                  </dt>
                  <dd className="text-base font-bold text-slate-900 tabular-nums">
                    200 فولورز / اليوم
                  </dd>
                </div>
                <div className="py-4 flex items-baseline justify-between gap-4">
                  <dt className="text-sm font-medium text-slate-700">
                    حد اللايكات اليومي
                  </dt>
                  <dd className="text-base font-bold text-emerald-800 tabular-nums">
                    100 لايك / اليوم
                  </dd>
                </div>
                <div className="py-4 flex items-baseline justify-between gap-4">
                  <dt className="text-sm font-medium text-slate-700">
                    المعلومات البنكية
                  </dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    غير مطلوبة نهائياً
                  </dd>
                </div>
                <div className="py-4 flex items-baseline justify-between gap-4">
                  <dt className="text-sm font-medium text-slate-700">
                    استلام الطلبات
                  </dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    يُرسل اسم حسابك فور تأكيد الطلب
                  </dd>
                </div>
              </dl>
            </div>

            <p className="mt-6 text-xs text-slate-500 leading-relaxed">
              ملاحظة أمان: يتم التحقق من حسابك عبر الاسم ورقم الهاتف وكلمة المرور المخصصة دون الحاجة لأي بيانات مالية.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
