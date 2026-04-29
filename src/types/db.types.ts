export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string; // mapped from password_hash
  avatarUrl?: string; // mapped from avatar_url
  isVerified: boolean; // mapped from is_verified
  verificationToken?: string; // mapped from verification_token
  resetPasswordToken?: string; // mapped from reset_password_token
  resetPasswordExpires?: Date; // mapped from reset_password_expires
  createdAt: Date; // mapped from created_at
  updatedAt: Date; // mapped from updated_at
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string; // mapped from user_id
  isRevoked: boolean; // mapped from is_revoked
  expiresAt: Date; // mapped from expires_at
  createdAt: Date; // mapped from created_at
}

export interface PhoneAd {
  id: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  condition: 'brandNew' | 'likeNew' | 'good' | 'fair';
  city: string;
  description: string;
  contactNumber: string; // mapped from contact_number
  photoUrls: string; // mapped from photo_urls
  sellerName: string; // mapped from seller_name
  isActive: boolean; // mapped from is_active
  createdAt: Date; // mapped from created_at
  updatedAt: Date; // mapped from updated_at
  userId: string; // mapped from user_id
}

export interface Brand {
  id: number;
  name: string;
}

export interface City {
  id: number;
  name: string;
}
