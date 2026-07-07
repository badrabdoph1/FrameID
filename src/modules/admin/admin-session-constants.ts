export const ADMIN_SESSION_COOKIE_NAME = "frameid_admin_session";
export const ADMIN_SESSION_TTL_DAYS = 30;

export type AdminSessionCookie = {
  name: typeof ADMIN_SESSION_COOKIE_NAME;
  value: string;
  options: {
    expires: Date;
    httpOnly: true;
    path: "/";
    sameSite: "lax";
    secure: boolean;
  };
};
