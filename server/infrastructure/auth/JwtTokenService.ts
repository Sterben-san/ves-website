import jwt from "jsonwebtoken";
import type { Admin } from "@/server/domain/entities";
import type { ITokenService } from "@/server/domain/services";
import { requireEnv } from "@/server/config/env";

type TokenPayload = { sub: string; email: string };

export class JwtTokenService implements ITokenService {
  signAccess(admin: Admin): string {
    return jwt.sign({ sub: admin.id, email: admin.email }, requireEnv("jwtAccessSecret"), {
      expiresIn: "15m"
    });
  }

  signRefresh(admin: Admin): string {
    return jwt.sign({ sub: admin.id, email: admin.email }, requireEnv("jwtRefreshSecret"), {
      expiresIn: "7d"
    });
  }

  verifyAccess(token: string) {
    const payload = jwt.verify(token, requireEnv("jwtAccessSecret")) as TokenPayload;
    return { adminId: payload.sub, email: payload.email };
  }

  verifyRefresh(token: string) {
    const payload = jwt.verify(token, requireEnv("jwtRefreshSecret")) as TokenPayload;
    return { adminId: payload.sub, email: payload.email };
  }
}
