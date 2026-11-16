import OpenAI from 'openai';
export function describeOpenAIError(error) {
  const status = Number.isInteger(error?.status) ? error.status : null;
  const code = error?.code;
  if (error instanceof OpenAI.APIConnectionTimeoutError) return 'Превышено время ожидания OpenAI (30 секунд). Проверьте соединение и попробуйте снова.';
  if (error instanceof OpenAI.APIConnectionError) { const allowed = new Set(['EPERM','EACCES','ENOTFOUND','EAI_AGAIN','ECONNREFUSED','ECONNRESET','ETIMEDOUT','ENETUNREACH','EHOSTUNREACH','CERT_HAS_EXPIRED','UNABLE_TO_VERIFY_LEAF_SIGNATURE','SELF_SIGNED_CERT_IN_CHAIN','UND_ERR_CONNECT_TIMEOUT','UND_ERR_SOCKET','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT','ERR_INVALID_CHAR','ERR_INVALID_HTTP_TOKEN','ERR_INVALID_URL','DEPTH_ZERO_SELF_SIGNED_CERT','CERT_UNTRUSTED','ECONNABORTED','ERR_TLS_CERT_ALTNAME_INVALID']); let cause = error.cause; for (let i = 0; cause && i < 5; i++, cause = cause.cause) { if (typeof cause.message === 'string' && /invalid character|invalid header|not a valid http header|cannot be converted to a byte string|cannot convert argument to a bytestring/i.test(cause.message)) return 'Не удалось подготовить запрос: недопустимые символы в настройках авторизации. Проверьте ключ в .env, не отправляя его в чат.'; if (allowed.has(cause.code)) return 'Не удалось соединиться с OpenAI. Код сетевой ошибки: ' + cause.code + '.'; } return 'Не удалось соединиться с OpenAI. Код причины недоступен.'; }
  if (status === 401) return 'OpenAI отклонил авторизацию (401). Проверьте ключ API в .env и перезапустите сервер.';
  if (status === 403) return 'OpenAI отказал в доступе (403). Проверьте права ключа и доступ к модели в аккаунте API.';
  if (status === 404 || code === 'model_not_found') return 'Модель не найдена или недоступна для этого аккаунта API. Проверьте OPENAI_MODEL и доступ к модели.';
  if (code === 'credit_balance_exhausted' || code === 'insufficient_quota') return 'Недостаточно средств или исчерпана квота OpenAI API. Проверьте биллинг аккаунта API.';
  if (status === 429) return 'OpenAI отклонил запрос из-за лимита (429). Проверьте лимиты и биллинг API или повторите позже.';
  if (status === 400 || status === 422) return `OpenAI отклонил параметры запроса (${status}). Проверьте доступность модели и поддержку настроек запроса.`;
  if (status && status >= 500) return `Ошибка сервиса OpenAI (${status}). Попробуйте позже.`;
  return status ? `OpenAI вернул ошибку ${status}. Проверьте настройки и доступ к модели.` : 'Не удалось получить ответ OpenAI. Проверьте соединение и настройки.';
}






