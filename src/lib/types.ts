export type OrderStatus = 'مكتمل' | 'قيد المعالجة';

export type ServiceType = 'followers' | 'likes';

export type AppPage = 'order' | 'history' | 'admin';

export interface UserProfile {
  fullName: string;
  phone: string;
  normalizedPhone: string;
  loggedInAt: string;
}

export interface RegistrationRecord {
  id: string;
  fullName: string;
  phone: string;
  normalizedPhone: string;
  registeredAt: string;
  lastSeenAt: string;
}

export interface FollowerOrder {
  id: string;
  orderNumber: string;
  userPhone: string;
  userName: string;
  serviceType: ServiceType;
  serviceLabel: string;
  followersCount: number;
  regionLabel: 'المغربي' | 'لايكات';
  accountHandle: string;
  status: OrderStatus;
  createdAt: string;
  dayKey: string;
}
