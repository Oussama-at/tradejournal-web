const BASE_URL = 'https://trading-api-9trn.onrender.com';

const getToken = () => localStorage.getItem('token');
const getDeviceId = () => localStorage.getItem('device_id');

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...(getDeviceId() ? { 'X-Device-Id': getDeviceId() } : {}),
  ...extra,
});

async function request(method, endpoint, body = null) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  const data = await res.json();
  return data;
}

const api = {
  get:    (ep)       => request('GET',    ep),
  post:   (ep, body) => request('POST',   ep, body),
  put:    (ep, body) => request('PUT',    ep, body),
  delete: (ep)       => request('DELETE', ep),

  postNoAuth: async (ep, body) => {
    const res = await fetch(`${BASE_URL}${ep}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  },

  uploadFile: async (endpoint, file, fieldName = 'image') => {
    const form = new FormData();
    form.append(fieldName, file);
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(getDeviceId() ? { 'X-Device-Id': getDeviceId() } : {}),
      },
      body: form,
    });
    return res.json();
  },
};

export default api;
