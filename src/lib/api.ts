import type {
  FollowerOrder,
  RegistrationRecord,
  ServiceType,
  UserProfile,
} from './types.ts';

export interface LoginApiResponse {
  user: UserProfile;
  orders: FollowerOrder[];
}

export interface CreateOrderApiResponse {
  order: FollowerOrder;
  orders: FollowerOrder[];
}

export interface AdminSubmissionsResponse {
  registrations: RegistrationRecord[];
  orders: FollowerOrder[];
}

export async function loginUserApi(input: {
  fullName: string;
  phone: string;
  password: string;
}): Promise<LoginApiResponse> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as Partial<LoginApiResponse> & {
    error?: string;
  };
  if (!response.ok || !data.user) {
    throw new Error(data.error || 'تعذر تسجيل الدخول.');
  }
  return {
    user: data.user,
    orders: Array.isArray(data.orders) ? data.orders : [],
  };
}

export async function fetchUserOrdersApi(phone: string): Promise<FollowerOrder[]> {
  const response = await fetch(`/api/orders?phone=${encodeURIComponent(phone)}`);
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as { orders?: FollowerOrder[] };
  return Array.isArray(data.orders) ? data.orders : [];
}

export async function createOrderApi(input: {
  userPhone: string;
  userName: string;
  serviceType: ServiceType;
  amount: number;
  accountHandle: string;
}): Promise<CreateOrderApiResponse> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as Partial<CreateOrderApiResponse> & {
    error?: string;
  };
  if (!response.ok || !data.order) {
    throw new Error(data.error || 'تعذر إرسال الطلب.');
  }
  return {
    order: data.order,
    orders: Array.isArray(data.orders) ? data.orders : [],
  };
}

export async function fetchAdminSubmissionsApi(): Promise<AdminSubmissionsResponse> {
  const response = await fetch('/api/admin/submissions');
  if (!response.ok) {
    throw new Error('تعذر تحميل الطلبات الواردة.');
  }
  const data = (await response.json()) as Partial<AdminSubmissionsResponse>;
  return {
    registrations: Array.isArray(data.registrations) ? data.registrations : [],
    orders: Array.isArray(data.orders) ? data.orders : [],
  };
}
