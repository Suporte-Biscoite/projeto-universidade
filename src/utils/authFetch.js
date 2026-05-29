// src/utils/authFetch.js
// Wrapper de fetch que renova o token automaticamente quando expira

async function refreshToken() {
  const refreshToken = sessionStorage.getItem('biscoite_refresh_token')
                    || localStorage.getItem('biscoite_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch('/api/auth?action=refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;

    const data = await res.json();

    // Salva novos tokens no mesmo storage onde estavam
    const inSession = !!sessionStorage.getItem('biscoite_access_token');
    const storage   = inSession ? sessionStorage : localStorage;
    storage.setItem('biscoite_access_token',  data.accessToken);
    storage.setItem('biscoite_refresh_token', data.refreshToken);

    return data.accessToken;
  } catch {
    return null;
  }
}

export function getToken() {
  return sessionStorage.getItem('biscoite_access_token')
      || localStorage.getItem('biscoite_access_token')
      || null;
}

// Fetch autenticado com renovação automática de token
export async function authFetch(url, options = {}) {
  let token = getToken();

  const makeRequest = (t) => fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
  });

  let res = await makeRequest(token);

  // Token expirado — tenta renovar e repetir
  if (res.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      res = await makeRequest(newToken);
    } else {
      // Refresh também falhou — redireciona para login
      sessionStorage.removeItem('biscoite_auth');
      localStorage.removeItem('biscoite_auth');
      window.location.href = '/login';
      return res;
    }
  }

  return res;
}
