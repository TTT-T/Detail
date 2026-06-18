import { SignJWT, jwtVerify } from 'jose';

export const PORTAL_COOKIE = 'portal_token';
export const SSO_COOKIE = 'sso_token';

// PORTAL_JWT_SECRET ใช้สำหรับ portal token + SSO token เท่านั้น
// ต้องตั้งค่าเดียวกันในทุกโปรเจกค์ที่ต้องการรับ SSO
const secret = new TextEncoder().encode(
  process.env.PORTAL_JWT_SECRET ||
  process.env.JWT_SECRET ||
  'change_me_in_production_use_same_value_across_all_projects'
);

export interface PortalTokenPayload {
  sub: string;
  email: string;
  name: string;
  portalRole: string;
  projectRoles: Record<string, string>;
}

export async function signPortalToken(payload: PortalTokenPayload, rememberMe = false): Promise<string> {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    portalRole: payload.portalRole,
    projectRoles: payload.projectRoles,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(rememberMe ? '30d' : '24h')
    .sign(secret);
}

export async function signSSOToken(payload: PortalTokenPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    portalRole: payload.portalRole,
    projectRoles: payload.projectRoles,
    sso: true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<PortalTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      portalRole: payload.portalRole as string,
      projectRoles: (payload.projectRoles ?? {}) as Record<string, string>,
    };
  } catch {
    return null;
  }
}
