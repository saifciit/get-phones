import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhoneAd {
  id: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  condition_val: 'brandNew' | 'likeNew' | 'good' | 'fair';
  city: string;
  description: string;
  contact_number: string;
  photo_urls: string[];
  user_id: string;
  seller_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked: boolean;
}
