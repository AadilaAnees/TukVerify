const BASE = '/api';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  if (!data.success && res.status >= 400) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  health: () => req('/health'),
  stats: () => req('/stats'),

  // Drivers
  getDrivers: () => req('/drivers'),
  getDriver: (nic) => req(`/drivers/${nic}`),
  enrollDriver: (body) => req('/drivers/enroll', { method: 'POST', body }),
  confirmEnrollment: (body) => req('/drivers/enroll/confirm', { method: 'POST', body }),
  getVerifyUrl: (body) => req('/drivers/verify-url', { method: 'POST', body }),

  // Sessions
  getSessions: () => req('/sessions'),
  getSession: (id) => req(`/sessions/${id}`),
  startSession: (body) => req('/sessions/start', { method: 'POST', body }),
  endSession: (id) => req(`/sessions/${id}/end`, { method: 'POST' }),
  reVerify: (id) => req(`/sessions/${id}/reverify`, { method: 'POST' }),
  addRide: (id, body) => req(`/sessions/${id}/rides`, { method: 'POST', body }),
};
