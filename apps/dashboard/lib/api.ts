const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiCall<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${path}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

// Auth
export async function signup(email: string, password: string, name?: string) {
  return apiCall<{ user: { id: string; email: string }; apiKey: string }>('/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(email: string, password: string) {
  return apiCall<{ accessToken: string; refreshToken: string; user: { id: string; email: string } }>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(accessToken: string) {
  return apiCall<{
    user: { id: string; email: string; name?: string; plan: string };
    apiKeys: Array<{ id: string; name: string; prefix: string; lastUsedAt?: string; createdAt: string }>;
  }>('/v1/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function createApiKey(accessToken: string, name: string) {
  return apiCall<{ id: string; name: string; key: string; prefix: string }>('/v1/auth/keys', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name }),
  });
}

export async function deleteApiKey(accessToken: string, keyId: string) {
  return apiCall<void>(`/v1/auth/keys/${keyId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Permissions
export async function getPermissions(apiKey: string) {
  return apiCall<Array<{
    id: string;
    userAddress: string;
    chains: number[];
    expiresAt: string;
    usage: { spent: Record<string, string>; txCount: number };
  }>>('/v1/permissions', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

// Transactions
export async function getTransactionHistory(apiKey: string, permissionId: string) {
  return apiCall<Array<{
    id: string;
    hash: string;
    chainId: number;
    to: string;
    value: string;
    status: string;
    createdAt: string;
  }>>(`/v1/tx/history/${permissionId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}
