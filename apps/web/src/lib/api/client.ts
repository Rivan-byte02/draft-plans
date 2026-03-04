const defaultApiBaseUrl = 'http://localhost:3000';

export class ApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl;
}

export async function apiRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: 'Unexpected API error' }));

    const message =
      typeof errorBody?.message === 'string'
        ? errorBody.message
        : Array.isArray(errorBody?.message)
          ? errorBody.message.join(', ')
          : 'Unexpected API error';

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
