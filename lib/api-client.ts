/**
 * API Client for EGPB Ticket System
 * ใช้แทน Supabase Client
 */

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

interface TicketFilter {
  [key: string]: string | number | boolean | undefined;
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  unviewedOnly?: string;
}

interface UserFilter {
  [key: string]: string | number | undefined;
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

import { BASE_PATH } from './constants';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? BASE_PATH : `http://localhost:3000${BASE_PATH}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Response is not JSON (likely HTML error page)
        console.error('API returned non-JSON response:', endpoint, response.status);
        return {
          success: false,
          error: `Server returned non-JSON response (${response.status})`,
        };
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized globally
        if (response.status === 401) {
          // If we are in the browser and not on the login page, redirect to login
          const loginPath = `${BASE_PATH}/login`;
          if (typeof window !== 'undefined' && window.location.pathname !== loginPath) {
            window.location.href = loginPath;
            return {
              success: false,
              error: 'Session expired. Redirecting to login...',
            };
          }
        }

        return {
          success: false,
          error: data.error || 'An error occurred',
          ...data, // Include all additional fields like remainingAttempts, code, warning, etc.
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('API request error:', endpoint, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth methods
  auth = {
    signIn: async (username: string, password: string, remember: boolean = false) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, remember }),
      });
    },

    signOut: async () => {
      return this.request('/auth/logout', {
        method: 'POST',
      });
    },

    getUser: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.request<{ user: any }>('/auth/me');
    },

    signUp: async (email: string, username: string, password: string) => {
      return this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, username, password }),
      });
    },
  };

  // Tickets methods
  tickets = {
    list: async (filters?: TicketFilter) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach(key => {
          const value = filters[key];
          if (value !== undefined && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.request<{ tickets: any[]; count: number; statusCounts?: any }>(`/tickets?${params}`);
    },

    get: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.request<{ ticket: any }>(`/tickets/${id}`);

      if (!response.success) {
        return response;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ticket = (response.data as any)?.ticket;
      if (!ticket) {
        return { success: false, error: 'Invalid ticket response' };
      }

      return { success: true, data: ticket };
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (data: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.request<{ ticket: any }>('/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.success) {
        return response;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ticket = (response.data as any)?.ticket;
      if (!ticket) {
        return { success: false, error: 'Invalid ticket response' };
      }

      return { success: true, data: ticket };
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (id: string, data: any): Promise<ApiResponse<{ ticket: any }>> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.request<{ ticket: any }>(`/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      if (!response.success) {
        return response;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ticket = (response.data as any)?.ticket;
      if (!ticket) {
        return { success: false, error: 'Invalid ticket response' };
      }

      return { success: true, data: ticket };
    },

    delete: async (id: string) => {
      return this.request(`/tickets/${id}`, {
        method: 'DELETE',
      });
    },

    markAllRead: async () => {
      return this.request('/tickets/mark-read', {
        method: 'POST',
      });
    },
  };

  // Engineer Tickets methods
  engineerTickets = {
    list: async (filters?: TicketFilter) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach(key => {
          const value = filters[key];
          if (value !== undefined && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.request<{ tickets: any[]; count: number; statusCounts?: any }>(`/engineer-tickets?${params}`);
    },

    get: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.request<{ ticket: any }>(
        `/engineer-tickets/${id}`
      );

      if (!response.success) {
        return response;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ticket = (response.data as any)?.ticket;
      if (!ticket) {
        return { success: false, error: 'Invalid engineer ticket response' };
      }

      return { success: true, data: ticket };
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (data: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.request<{ ticket: any }>(
        '/engineer-tickets',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );

      if (!response.success) {
        return response;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ticket = (response.data as any)?.ticket;
      if (!ticket) {
        return { success: false, error: 'Invalid engineer ticket response' };
      }

      return { success: true, data: ticket };
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (id: string, data: any): Promise<ApiResponse<{ ticket: any }>> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.request<{ ticket: any }>(
        `/engineer-tickets/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      );

      if (!response.success) {
        return response;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ticket = (response.data as any)?.ticket;
      if (!ticket) {
        return { success: false, error: 'Invalid engineer ticket response' };
      }

      return { success: true, data: ticket };
    },

    markAllRead: async () => {
      return this.request('/engineer-tickets/mark-read', {
        method: 'POST',
      });
    },
  };

  // Users methods
  users = {
    list: async (filters?: UserFilter) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach(key => {
          const value = filters[key];
          if (value !== undefined && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.request<{ users: any[]; pagination?: { total: number; page: number; limit: number; totalPages: number } }>(`/users?${params}`);
    },

    get: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.request<{ user: any }>(`/users/${id}`);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (data: any) => {
      return this.request('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (id: string, data: any) => {
      return this.request(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string) => {
      return this.request(`/users/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // Stats methods
  stats = {
    summary: async (params?: { from?: string; to?: string; type?: 'IT' | 'ENGINEER' }) => {
      const searchParams = new URLSearchParams();
      if (params?.from) searchParams.append('from', params.from);
      if (params?.to) searchParams.append('to', params.to);
      if (params?.type) searchParams.append('type', params.type);

      return this.request<{
        totalTickets: number;
        thisMonthTickets: number;
        activeUsers: number;
        avgResolutionHours: number | null;
        statusBreakdown: { status: string; count: number }[];
        typeBreakdown: { type: string; count: number }[];
      }>(`/stats/summary?${searchParams.toString()}`);
    },

    damageTypes: async (params: { month: number; year: number; type: 'IT' | 'ENGINEER' }) => {
      const searchParams = new URLSearchParams();
      searchParams.append('month', params.month.toString());
      searchParams.append('year', params.year.toString());
      searchParams.append('type', params.type);

      return this.request<{
        month: number;
        year: number;
        totalCount: number;
        typeBreakdown: { type: string; count: number; percentage: number }[];
      }>(`/stats/damage-types?${searchParams.toString()}`);
    },
  };

  // Admin methods
  admin = {
    // Get all blocked IPs
    getBlockedIPs: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.request<any>('/admin/blocked-ips');
    },

    // Unblock IP by ID
    unblockIP: async (id: string) => {
      return this.request(`/admin/blocked-ips/${id}`, {
        method: 'DELETE',
      });
    },

    // Unlock user account
    unlockUser: async (userId: string) => {
      return this.request(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'unlock' }),
      });
    },

    // Lock user account
    lockUser: async (userId: string) => {
      return this.request(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'lock' }),
      });
    },
  };
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
