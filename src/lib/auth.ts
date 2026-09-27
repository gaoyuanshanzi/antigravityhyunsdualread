export const ADMIN_USERNAME = 'admin';
export const ADMIN_PASSWORD = '123jesus';
export const AUTH_COOKIE_KEY = 'hyuns_dualread_session';
export const AUTH_STORAGE_KEY = 'hyuns_dualread_auth';

export function verifyCredentials(id: string, pass: string): boolean {
  return id.trim() === ADMIN_USERNAME && pass === ADMIN_PASSWORD;
}
