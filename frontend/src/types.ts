export interface Listing {
  city: string;
  street: string;
  rooms: number;
  price: number;
  floor: number;
  total_floors: number;
  has_elevator: boolean;
  has_parking: boolean;
  raw_text: string;
}

export interface User {
  phone: string;
  full_name?: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}
