import { verifyPassword } from "@/modules/auth/password-hashing";
import { parseLoginInput } from "@/modules/auth/login-validation";
import {
  createSessionForUser,
  type SessionRepository
} from "@/modules/auth/session-service";
import type { SessionCookie } from "@/modules/auth/session-tokens";

export type AuthenticatedUser = {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  role: string;
};

export type LoginRepository = {
  findUserByIdentifier(input: { email: string; phone: string | null }): Promise<
    | (AuthenticatedUser & {
        passwordHash: string | null;
        deletedAt: Date | null;
      })
    | null
  >;
} & SessionRepository;

export type LoginResult = {
  user: AuthenticatedUser;
  session: {
    id: string;
    expiresAt: Date;
    cookie: SessionCookie;
  };
};

type LoginServiceOptions = {
  repository: LoginRepository;
  now?: () => Date;
  cookieSecure?: boolean;
};

export function createLoginService({
  repository,
  now = () => new Date(),
  cookieSecure
}: LoginServiceOptions) {
  return {
    async login(input: unknown): Promise<LoginResult> {
      const credentials = parseLoginInput(input);
      const user = await repository.findUserByIdentifier({
        email: credentials.email,
        phone: credentials.phone
      });

      if (!user) {
        throw new Error("Invalid phone/email or password");
      }

      if (user.deletedAt) {
        throw new Error("Account deleted");
      }

      if (!user.passwordHash) {
        throw new Error("Invalid phone/email or password");
      }

      const passwordIsValid = await verifyPassword(
        credentials.password,
        user.passwordHash
      );

      if (!passwordIsValid) {
        throw new Error("Invalid phone/email or password");
      }

      const session = await createSessionForUser({
        repository,
        userId: user.id,
        now,
        cookieSecure
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          cookie: session.cookie
        }
      };
    }
  };
}
