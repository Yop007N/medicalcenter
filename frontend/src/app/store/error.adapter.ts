interface ApiErrorBody {
  msg?: string;
  message?: string;
}

interface ApiErrorLike {
  error?: ApiErrorBody | string | null;
  message?: string;
}

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const apiError = error as ApiErrorLike;

  if (typeof apiError.error === 'string' && apiError.error.trim().length > 0) {
    return apiError.error;
  }

  if (apiError.error && typeof apiError.error === 'object') {
    if (typeof apiError.error.msg === 'string' && apiError.error.msg.trim().length > 0) {
      return apiError.error.msg;
    }

    if (typeof apiError.error.message === 'string' && apiError.error.message.trim().length > 0) {
      return apiError.error.message;
    }
  }

  if (typeof apiError.message === 'string' && apiError.message.trim().length > 0) {
    return apiError.message;
  }

  return fallback;
};
