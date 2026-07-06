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
  name: string;
  role: string;
};

export type LoginRepository = {
  findUserByEmail(email: string): Promise<
    | (AuthenticatedUser & {
        passwordHash: string | null;
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
};

export function createLoginService({
  repository,
  now = () => new Date()
}: LoginServiceOptions) {
  return {
    async login(input: unknown): Promise<LoginResult> {
      const credentials = parseLoginInput(input);
      const user = await repository.findUserByEmail(credentials.email);

      if (!user?.passwordHash) {
        throw new Error("Invalid email or password");
      }

      const passwordIsValid = await verifyPassword(
        credentials.password,
        user.passwordHash
      );

      if (!passwordIsValid) {
        throw new Error("Invalid email or password");
      }

      const session = await createSessionForUser({
        repository,
        userId: user.id,
        now
      });

      return {
        user: {
          id: user.id,
          email: user.email,
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
