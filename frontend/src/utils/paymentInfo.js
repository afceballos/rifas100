// Normaliza raffle.payment_info (JSON string) a un arreglo de métodos de pago.
// Los datos guardados antes de soportar múltiples métodos eran un solo objeto
// {method, institution, details, description}; aquí se envuelve en un arreglo
// de un elemento para mantener compatibilidad hacia atrás.
export const parsePaymentMethods = (raw) => {
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object' && parsed.method) return [parsed];
  return [];
};
