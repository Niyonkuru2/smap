// src/types/index.ts
export type UserRole = 'admin' | 'vendor' | 'consumer' | 'business' | 'agent';

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  market_id?: string;
  province?: string;
  district?: string;
}

// Market type for multi-market support
export interface Market {
    id: string;
    name: string;
    location: string;
    district: string;
    province: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    isActive: boolean;
    distance?: number; // Distance from user in km (used in route planning)
}

// Price prediction type
export interface PricePrediction {
    productId: string;
    productName: string;
    currentPrice: number;
    predictedPrice: number;
    predictedDate: string;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    factors: string[];
}

// SMS/USSD request types
export interface SMSRequest {
    phone: string;
    message: string;
    type: 'price_query' | 'price_alert' | 'verification';
}

export interface USSDSession {
    sessionId: string;
    phone: string;
    currentMenu: string;
    data: Record<string, any>;
}

// Alias for backward compatibility if needed, though we will update usages
export type User = UserType;

// Price submission type for admin approvals
export interface PriceSubmission {
  id: string;
  productId: string;
  marketId: string;
  vendorId: string;
  vendorName: string;
  price: number;
  quantity: number;
  unit: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  ageInHours: number;
  imageUrl?: string;
  rejectionReason?: string;
}

// API Response wrapper type
export interface BaseApiResponse {
  status?: string;
  ok?: boolean;
  demoMode?: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
}
