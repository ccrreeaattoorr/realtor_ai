export interface Listing {
  id?: string;
  city: string;
  street: string;
  rooms: number;
  price: number;
  floor: number;
  total_floors: number;
  has_elevator: boolean;
  has_parking: boolean;
  has_mamad?: boolean;
  raw_text: string;
  created_at?: string;
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
