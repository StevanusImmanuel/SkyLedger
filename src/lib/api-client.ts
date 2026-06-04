'use client';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { timeout = 10000, retries = 0, ...init } = options;

  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    throw new ApiError('You are offline. Please check your internet connection.');
  }

  let attempt = 0;
  while (true) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(id);

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login/restricted';
        }
        throw new ApiError('Unauthorized. Redirecting to restricted login...', 401);
      }

      if (response.status === 403) {
        if (typeof window !== 'undefined') {
          window.location.href = '/forbidden';
        }
        throw new ApiError('Forbidden. Redirecting to access denied screen...', 403);
      }

      return response;
    } catch (error: any) {
      clearTimeout(id);

      const isTimeout = error.name === 'AbortError';
      const errorMessage = isTimeout
        ? 'Request timed out. Please try again.'
        : 'Network error or connection lost. Please check your connection.';

      if (attempt < retries && !isTimeout) {
        attempt++;
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      throw new ApiError(errorMessage, isTimeout ? 408 : undefined);
    }
  }
}
