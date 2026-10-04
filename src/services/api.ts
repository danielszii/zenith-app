import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

const AUTH_SERVICE = 'zenith.auth'; const API_SERVICE = 'zenith.api';
const defaultUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
export type Session = { token: string; user: { id: string; nome: string; email: string; role: string } };

export async function getApiUrl() { const saved = await Keychain.getGenericPassword({ service: API_SERVICE }); return saved ? saved.password : defaultUrl; }
export async function setApiUrl(url: string) { await Keychain.setGenericPassword('api', url.replace(/\/$/, ''), { service: API_SERVICE }); }
export async function getSession(): Promise<Session | null> { const saved = await Keychain.getGenericPassword({ service: AUTH_SERVICE }); if (!saved) return null; try { return JSON.parse(saved.password) as Session; } catch { return null; } }
export async function saveSession(session: Session) { await Keychain.setGenericPassword('session', JSON.stringify(session), { service: AUTH_SERVICE }); }
export async function clearSession() { await Keychain.resetGenericPassword({ service: AUTH_SERVICE }); }

export async function apiRequest<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const [url, session] = await Promise.all([getApiUrl(), authenticated ? getSession() : Promise.resolve(null)]);
  const response = await fetch(`${url}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.token}` } : {}), ...init.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.error || `Erro HTTP ${response.status}`);
  return body as T;
}

export async function login(email: string, senha: string, apiUrl: string) {
  await setApiUrl(apiUrl);
  const result = await apiRequest<{ token: string; usuario: Session['user'] }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }, false);
  const session = { token: result.token, user: result.usuario }; await saveSession(session); return session;
}
