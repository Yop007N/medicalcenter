interface ApiErrorBody {
  msg?: string;
  message?: string;
}

interface ApiErrorLike {
  status?: number;
  error?: ApiErrorBody | string | null;
  message?: string;
}

const isLikelyHtml = (rawValue: string): boolean =>
  /<\s*(?:!doctype|html|head|body|title|center|h1)\b/i.test(rawValue);

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const apiError = error as ApiErrorLike;
  const status = apiError.status;

  if (status === 413) {
    return 'El archivo excede el tamaño máximo permitido (64 MB).';
  }

  if (typeof apiError.error === 'string' && apiError.error.trim().length > 0) {
    return isLikelyHtml(apiError.error) ? fallback : apiError.error;
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
    return isLikelyHtml(apiError.message) ? fallback : apiError.message;
  }

  return fallback;
};
