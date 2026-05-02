import type { Listing, AuthResponse } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const fetchListings = async (
  city?: string, 
  minRooms?: number, 
  maxPrice?: number, 
  page: number = 1,
  hasElevator?: boolean,
  hasParking?: boolean,
  hasMamad?: boolean,
  freeText?: string
): Promise<any> => {
  const url = new URL(`${API_BASE_URL}/listings`);
  if (city) url.searchParams.append('city', city);
  if (minRooms) url.searchParams.append('min_rooms', minRooms.toString());
  if (maxPrice) url.searchParams.append('max_price', maxPrice.toString());
  if (hasElevator !== undefined) url.searchParams.append('has_elevator', hasElevator.toString());
  if (hasParking !== undefined) url.searchParams.append('has_parking', hasParking.toString());
  if (hasMamad !== undefined) url.searchParams.append('has_mamad', hasMamad.toString());
  if (freeText) url.searchParams.append('free_text', freeText);
  
  url.searchParams.append('page', page.toString());
  url.searchParams.append('size', '5');

  const response = await fetch(url.toString(), { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch listings');
  return response.json();
};

export const login = async (formData: FormData): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
};

const safeFetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
  try {
    return await fetch(input, init);
  } catch (e: any) {
    throw new Error('לא ניתן להתחבר לשרת. בדוק חיבור לאינטרנט ונסה שוב.');
  }
};

const parseErrorDetail = async (response: Response, fallback: string): Promise<string> => {
  try {
    const error = await response.json();
    return error.detail || fallback;
  } catch {
    return fallback;
  }
};

export const register = async (userData: any): Promise<any> => {
  const response = await safeFetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, 'Registration failed'));
  }
  return response.json();
};

export const verifyOTP = async (phone: string, otp: string): Promise<any> => {
  const formData = new FormData();
  formData.append('phone', phone);
  formData.append('otp', otp);

  const response = await safeFetch(`${API_BASE_URL}/auth/verify`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, 'Verification failed'));
  }
  return response.json();
};

export const fetchAdminStats = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/admin/stats`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

export const updateListing = async (id: string, listing: Listing): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/listings/${id}`, {
    method: 'PUT',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(listing),
  });
  if (!response.ok) throw new Error('Update failed');
  return response.json();
};

export const deleteListing = async (id: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/listings/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Delete failed');
  return response.json();
};

export const bulkDeleteListings = async (startDate: string, endDate: string): Promise<any> => {
  const url = new URL(`${API_BASE_URL}/admin/listings/bulk`);
  url.searchParams.append('start_date', startDate);
  url.searchParams.append('end_date', endDate);

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Bulk delete failed');
  return response.json();
};

export const fetchUploadStatus = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/admin/upload-status`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch upload status');
  return response.json();
};

export const uploadListingsFile = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/admin/upload-listings`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
};
