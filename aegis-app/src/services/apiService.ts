/**
 * AEGIS Centralized API Client & Service Layer
 * Fully backend-compatible with standard REST / GraphQL / FastAPI / Node.js endpoints.
 * Automatically injects authorization tokens and supports graceful fallback when backend is offline.
 */

import { Brand, Finding, Scan, FindingStatus, Severity } from '../types';

export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

/**
 * Standard HTTP headers helper with Bearer token authentication
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('aegis-auth-token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * Robust JSON fetch wrapper with error interception
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T | null; error: Error | null; isMock: boolean }> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data, error: null, isMock: false };
  } catch (err: any) {
    // When backend server is offline or endpoint not yet routed, catch cleanly
    return { data: null, error: err, isMock: true };
  }
}

export const api = {
  // Authentication Endpoints
  auth: {
    async login(email: string, password: string) {
      return apiFetch<{ user: { name: string; email: string }; token?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },

    async register(payload: { name: string; email: string; password: string; organization?: string }) {
      return apiFetch<{ user: { name: string; email: string }; token?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async logout() {
      return apiFetch<{ success: boolean }>('/auth/logout', {
        method: 'POST'
      });
    },

    async getCurrentUser() {
      return apiFetch<{ name: string; email: string; organization?: string }>('/auth/me');
    }
  },

  // Brands Management Endpoints
  brands: {
    async getAll() {
      return apiFetch<Brand[]>('/brands');
    },

    async getById(id: string) {
      return apiFetch<Brand>(`/brands/${id}`);
    },

    async create(brand: Partial<Brand>) {
      return apiFetch<Brand>('/brands', {
        method: 'POST',
        body: JSON.stringify(brand)
      });
    },

    async update(id: string, updates: Partial<Brand>) {
      return apiFetch<Brand>(`/brands/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },

    async delete(id: string) {
      return apiFetch<{ success: boolean }>(`/brands/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Findings & Detections Endpoints
  findings: {
    async getAll() {
      return apiFetch<Finding[]>('/findings');
    },

    async getById(id: string) {
      return apiFetch<Finding>(`/findings/${id}`);
    },

    async updateStatus(id: string, status: FindingStatus) {
      return apiFetch<Finding>(`/findings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    async addNote(id: string, note: string) {
      return apiFetch<Finding>(`/findings/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note })
      });
    }
  },

  // Scans & Engine Endpoints
  scans: {
    async getAll() {
      return apiFetch<Scan[]>('/scans');
    },

    async run(brandId: string, targets: string[], scanType: string) {
      return apiFetch<Scan>('/scans/run', {
        method: 'POST',
        body: JSON.stringify({ brandId, targets, scanType })
      });
    },

    async retry(scanId: string) {
      return apiFetch<Scan>(`/scans/${scanId}/retry`, {
        method: 'POST'
      });
    }
  }
};
