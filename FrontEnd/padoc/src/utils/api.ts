import useAuthStore from '@/store/authStore';

const beApiUrl = process.env.NEXT_PUBLIC_BE_API_URL!;

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

// 기본 API 호출 함수
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const authStore = useAuthStore.getState();
  const headers = authStore.getAuthHeaders();

  try {
    const response = await fetch(`${beApiUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // 토큰 만료 처리
    if (response.status === 401) {
      const text = await response.text();
      let detail = '';
      try { 
        detail = (JSON.parse(text)?.detail as string) || ''; 
      } catch { 
        detail = text; 
      }

      if (typeof detail === 'string' && detail.includes('Signature has expired')) {
        authStore.clearAuth();
        window.location.href = '/';
        throw new Error('SESSION_EXPIRED');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      return {
        error: errorText || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    // 응답이 비어있는지 확인 (DELETE 요청 등에서 발생)
    const responseText = await response.text();
    let data;
    
    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        return {
          error: `Invalid JSON response: ${responseText}`,
          status: response.status,
        };
      }
    } else {
      data = null;
    }
    
    return { data, status: response.status };
  } catch (error: any) {
    return {
      error: error.message || 'Network error',
      status: 0,
    };
  }
};

// GET 요청
export const apiGet = <T = any>(endpoint: string): Promise<ApiResponse<T>> => {
  return apiCall<T>(endpoint, { method: 'GET' });
};

// POST 요청
export const apiPost = <T = any>(
  endpoint: string, 
  body?: any
): Promise<ApiResponse<T>> => {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
};

// PUT 요청
export const apiPut = <T = any>(
  endpoint: string, 
  body?: any
): Promise<ApiResponse<T>> => {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
};

// DELETE 요청
export const apiDelete = <T = any>(endpoint: string): Promise<ApiResponse<T>> => {
  return apiCall<T>(endpoint, { method: 'DELETE' });
};

// 인증이 필요한 API 호출을 위한 래퍼
export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const authStore = useAuthStore.getState();
  
  if (!authStore.checkAuth()) {
    return {
      error: 'Authentication required',
      status: 401,
    };
  }

  return apiCall<T>(endpoint, options);
};

export const authenticatedGet = <T = any>(endpoint: string): Promise<ApiResponse<T>> => {
  return authenticatedApiCall<T>(endpoint, { method: 'GET' });
};

export const authenticatedPost = <T = any>(
  endpoint: string, 
  body?: any
): Promise<ApiResponse<T>> => {
  return authenticatedApiCall<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
};

export const authenticatedPut = <T = any>(
  endpoint: string, 
  body?: any
): Promise<ApiResponse<T>> => {
  return authenticatedApiCall<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
};

export const authenticatedDelete = <T = any>(endpoint: string): Promise<ApiResponse<T>> => {
  return authenticatedApiCall<T>(endpoint, { method: 'DELETE' });
};
