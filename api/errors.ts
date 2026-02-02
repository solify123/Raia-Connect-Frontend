export interface ApiError {
  code: string;
  message: string;
}

export function normalizeError(error: unknown): ApiError {
  if (error && typeof error === 'object') {
    // Handle fetch Response errors
    if ('status' in error && 'statusText' in error) {
      return {
        code: String(error.status),
        message: (error as { statusText?: string }).statusText || 'Request failed',
      };
    }
    
    // Handle error objects with message
    if ('message' in error) {
      return {
        code: 'error' in error && typeof error.error === 'string' 
          ? error.error 
          : 'UNKNOWN_ERROR',
        message: String(error.message),
      };
    }
  }
  
  // Fallback for unknown errors
  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
}
