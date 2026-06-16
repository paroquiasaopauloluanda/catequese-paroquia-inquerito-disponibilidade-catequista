const GAS_URL = import.meta.env.VITE_GAS_URL;

function encodePayload(data: object): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function getToken(): string {
  return sessionStorage.getItem('admin_token') || '';
}

async function gasGet(params: Record<string, string>): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  const url = `${GAS_URL}?${qs}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  async checkDuplicate(primeiroNome: string, ultimoNome: string) {
    return gasGet({
      action: 'checkDuplicate',
      payload: encodePayload({ primeiroNome, ultimoNome }),
    }) as Promise<{ ok: boolean; exists: boolean }>;
  },

  async submit(data: object) {
    return gasGet({
      action: 'submit',
      payload: encodePayload(data),
    }) as Promise<{ ok: boolean; id?: string; error?: string }>;
  },

  async login(username: string, password: string) {
    const res = (await gasGet({
      action: 'login',
      payload: encodePayload({ username, password }),
    })) as { ok: boolean; token?: string; error?: string };
    if (res.ok && res.token) {
      sessionStorage.setItem('admin_token', res.token);
    }
    return res;
  },

  async getAll() {
    return gasGet({ action: 'getAll', token: getToken() }) as Promise<{
      ok: boolean;
      records: import('../types').Catequista[];
    }>;
  },

  async getStats() {
    return gasGet({ action: 'getStats', token: getToken() }) as Promise<{
      ok: boolean;
      stats: import('../types').Stats;
    }>;
  },

  async deleteRecord(id: string) {
    return gasGet({
      action: 'deleteRecord',
      token: getToken(),
      payload: encodePayload({ id }),
    }) as Promise<{ ok: boolean; error?: string }>;
  },

  async updateRecord(id: string, data: object) {
    return gasGet({
      action: 'updateRecord',
      token: getToken(),
      payload: encodePayload({ id, data }),
    }) as Promise<{ ok: boolean; error?: string }>;
  },

  async getConfig() {
    return gasGet({ action: 'getConfig' }) as Promise<{
      ok: boolean;
      config: import('../types').Config;
    }>;
  },

  async setConfig(config: object) {
    return gasGet({
      action: 'setConfig',
      token: getToken(),
      payload: encodePayload(config),
    }) as Promise<{ ok: boolean }>;
  },
};
