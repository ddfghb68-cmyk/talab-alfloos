import type { FollowerOrder, ServiceType, UserProfile } from './types.ts';

export const DAILY_MAX_FOLLOWERS = 200;
export const DAILY_MAX_LIKES = 100;
export const REQUIRED_PASSWORD = 'ادم';
export const QUICK_ORDER_PRESETS = [50, 100, 150, 200] as const;
export const QUICK_LIKES_PRESETS = [25, 50, 75, 100] as const;

export interface ServiceConfig {
  type: ServiceType;
  label: string;
  unitLabel: string;
  dailyMax: number;
  presets: readonly number[];
  regionLabel: 'المغربي' | 'لايكات';
}

export const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = {
  followers: {
    type: 'followers',
    label: 'فولورز مغربي',
    unitLabel: 'فولورز مغربي',
    dailyMax: DAILY_MAX_FOLLOWERS,
    presets: QUICK_ORDER_PRESETS,
    regionLabel: 'المغربي',
  },
  likes: {
    type: 'likes',
    label: 'لايكات',
    unitLabel: 'لايك',
    dailyMax: DAILY_MAX_LIKES,
    presets: QUICK_LIKES_PRESETS,
    regionLabel: 'لايكات',
  },
};

export function getServiceConfig(serviceType: ServiceType = 'followers'): ServiceConfig {
  return SERVICE_CONFIGS[serviceType] ?? SERVICE_CONFIGS.followers;
}

export function getLocalDayKey(input: Date | string = new Date()): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeArabicDigits(value: string): string {
  const eastern = '٠١٢٣٤٥٦٧٨٩';
  const extended = '۰۱۲۳۴۵۶۷۸۹';
  return value
    .replace(/[٠-٩]/g, (d) => String(eastern.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(extended.indexOf(d)));
}

export function normalizePhone(rawPhone: string): string {
  const ascii = normalizeArabicDigits(rawPhone).trim();
  const hasPlus = ascii.startsWith('+');
  const digitsOnly = ascii.replace(/\D/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

export interface LoginValidationResult {
  valid: boolean;
  error?: string;
  fullName?: string;
  phone?: string;
  normalizedPhone?: string;
}

export function validateLogin(input: {
  fullName: string;
  phone: string;
  password: string;
}): LoginValidationResult {
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  const rawPhone = input.phone.trim();
  const normalizedPhone = normalizePhone(rawPhone);
  const password = input.password.trim();

  if (fullName.length < 3) {
    return {
      valid: false,
      error: 'يرجى إدخال الاسم الكامل بشكل صحيح (3 أحرف على الأقل).',
    };
  }

  const digitsCount = normalizedPhone.replace(/\D/g, '').length;
  if (digitsCount < 8 || digitsCount > 15) {
    return {
      valid: false,
      error: 'يرجى إدخال رقم هاتف صحيح (من 8 إلى 15 رقماً).',
    };
  }

  if (!password) {
    return {
      valid: false,
      error: 'يرجى إدخال كلمة المرور.',
    };
  }

  if (password !== REQUIRED_PASSWORD) {
    return {
      valid: false,
      error: 'كلمة المرور غير صحيحة. يرجى التحقق والمحاولة مرة أخرى.',
    };
  }

  return {
    valid: true,
    fullName,
    phone: normalizeArabicDigits(rawPhone),
    normalizedPhone,
  };
}

export function getTodayUsedForService(
  orders: FollowerOrder[],
  serviceType: ServiceType = 'followers',
  now: Date = new Date()
): number {
  const todayKey = getLocalDayKey(now);
  return orders.reduce((total, order) => {
    const orderService: ServiceType = order.serviceType || 'followers';
    if (orderService !== serviceType) return total;
    const orderDay = order.dayKey || getLocalDayKey(order.createdAt);
    return orderDay === todayKey ? total + order.followersCount : total;
  }, 0);
}

export function getRemainingForService(
  orders: FollowerOrder[],
  serviceType: ServiceType = 'followers',
  now: Date = new Date()
): number {
  const config = getServiceConfig(serviceType);
  const used = getTodayUsedForService(orders, serviceType, now);
  return Math.max(0, config.dailyMax - used);
}

export function getTodayUsedFollowers(
  orders: FollowerOrder[],
  now: Date = new Date()
): number {
  return getTodayUsedForService(orders, 'followers', now);
}

export function getRemainingDailyFollowers(
  orders: FollowerOrder[],
  now: Date = new Date()
): number {
  return getRemainingForService(orders, 'followers', now);
}

export interface OrderValidationResult {
  valid: boolean;
  amount?: number;
  accountHandle?: string;
  serviceType: ServiceType;
  remainingBefore: number;
  remainingAfter?: number;
  error?: string;
}

export function validateServiceOrder(params: {
  rawAmount: string | number;
  accountHandle: string;
  serviceType: ServiceType;
  orders: FollowerOrder[];
  now?: Date;
}): OrderValidationResult {
  const { rawAmount, accountHandle, serviceType, orders, now = new Date() } = params;
  const config = getServiceConfig(serviceType);
  const remainingBefore = getRemainingForService(orders, serviceType, now);

  if (remainingBefore <= 0) {
    return {
      valid: false,
      serviceType,
      remainingBefore: 0,
      error: `لقد وصلت إلى الحد الأقصى اليومي لخدمة ${config.label} (${config.dailyMax}). يمكنك إرسال طلب جديد غداً.`,
    };
  }

  const cleanHandle = accountHandle.trim();
  if (cleanHandle.length < 2) {
    return {
      valid: false,
      serviceType,
      remainingBefore,
      error: 'يرجى إدخال اسم الحساب أو الرابط لنتمكن من إرسال طلبك.',
    };
  }

  const normalizedInput =
    typeof rawAmount === 'number'
      ? String(rawAmount)
      : normalizeArabicDigits(rawAmount).trim();

  if (!normalizedInput) {
    return {
      valid: false,
      serviceType,
      remainingBefore,
      error: `يرجى كتابة عدد ${config.label} المطلوب.`,
    };
  }

  if (!/^\d+$/.test(normalizedInput)) {
    return {
      valid: false,
      serviceType,
      remainingBefore,
      error: 'يرجى إدخال رقم صحيح بدون فواصل أو رموز.',
    };
  }

  const amount = Number.parseInt(normalizedInput, 10);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      valid: false,
      serviceType,
      remainingBefore,
      error: 'يجب أن يكون العدد المطلوب أكبر من صفر.',
    };
  }

  if (amount > config.dailyMax) {
    return {
      valid: false,
      serviceType,
      remainingBefore,
      error: `الحد الأقصى لطلب ${config.label} هو ${config.dailyMax} في اليوم فقط.`,
    };
  }

  if (amount > remainingBefore) {
    return {
      valid: false,
      serviceType,
      remainingBefore,
      error: `تجاوزت الحد اليومي المتبقي لخدمة ${config.label}. المتبقي لك اليوم هو ${remainingBefore} فقط.`,
    };
  }

  return {
    valid: true,
    amount,
    accountHandle: cleanHandle,
    serviceType,
    remainingBefore,
    remainingAfter: remainingBefore - amount,
  };
}

export function validateFollowerOrder(
  rawAmount: string | number,
  orders: FollowerOrder[],
  now: Date = new Date(),
  accountHandle = '@default_account'
): OrderValidationResult {
  return validateServiceOrder({
    rawAmount,
    accountHandle,
    serviceType: 'followers',
    orders,
    now,
  });
}

export function createFollowerOrder(params: {
  amount: number;
  accountHandle: string;
  serviceType?: ServiceType;
  user: UserProfile;
  existingOrdersCount: number;
  now?: Date;
}): FollowerOrder {
  const now = params.now ?? new Date();
  const serviceType: ServiceType = params.serviceType ?? 'followers';
  const config = getServiceConfig(serviceType);
  const cleanHandle = params.accountHandle.trim();
  const sequence = String(params.existingOrdersCount + 1).padStart(3, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const prefix = serviceType === 'likes' ? 'LK' : 'MA';

  return {
    id: `ord_${now.getTime()}_${randomSuffix}`,
    orderNumber: `${prefix}-${sequence}`,
    userPhone: params.user.normalizedPhone,
    userName: params.user.fullName,
    serviceType,
    serviceLabel: config.label,
    followersCount: params.amount,
    regionLabel: config.regionLabel,
    accountHandle: cleanHandle,
    status: 'مكتمل',
    createdAt: now.toISOString(),
    dayKey: getLocalDayKey(now),
  };
}

export function formatArabicDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return new Intl.DateTimeFormat('ar-MA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getTimeUntilDailyResetLabel(now: Date = new Date()): string {
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());
  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `يتجدد الحد اليومي بعد ${minutes} دقيقة`;
  }
  if (minutes === 0) {
    return `يتجدد الحد اليومي بعد ${hours} ساعة`;
  }
  return `يتجدد الحد اليومي بعد ${hours} ساعة و${minutes} دقيقة`;
}

export function buildOrdersCsv(orders: FollowerOrder[]): string {
  const headers = [
    'رقم الطلب',
    'الاسم الكامل',
    'رقم الهاتف',
    'اسم الحساب',
    'الخدمة',
    'الكمية',
    'التاريخ',
    'الحالة',
  ];
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };
  const rows = orders.map((order) => [
    order.orderNumber,
    order.userName,
    order.userPhone,
    order.accountHandle,
    order.serviceLabel || (order.serviceType === 'likes' ? 'لايكات' : 'فولورز مغربي'),
    order.followersCount,
    order.createdAt,
    order.status,
  ]);
  return '\uFEFF' + [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
}
