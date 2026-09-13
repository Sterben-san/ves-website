import type { Admin } from "@/server/domain/entities";
import type { IAdminRepository } from "@/server/domain/repositories";
import type { IPasswordService, ITokenService } from "@/server/domain/services";

export class LoginAdminUseCase {
  constructor(
    private readonly admins: IAdminRepository,
    private readonly passwords: IPasswordService,
    private readonly tokens: ITokenService
  ) {}

  async execute(email: string, password: string) {
    const admin = await this.admins.findByEmail(email.toLowerCase().trim());
    if (!admin) {
      throw new Error("Invalid email or password.");
    }

    const isValid = await this.passwords.compare(password, admin.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password.");
    }

    await this.admins.touchLastLogin(admin.id);

    return {
      admin: sanitizeAdmin(admin),
      accessToken: this.tokens.signAccess(admin),
      refreshToken: this.tokens.signRefresh(admin)
    };
  }
}

export class RefreshAdminSessionUseCase {
  constructor(
    private readonly admins: IAdminRepository,
    private readonly tokens: ITokenService
  ) {}

  async execute(refreshToken: string) {
    const payload = this.tokens.verifyRefresh(refreshToken);
    const admin = await this.admins.findById(payload.adminId);
    if (!admin) {
      throw new Error("Admin account no longer exists.");
    }

    return {
      admin: sanitizeAdmin(admin),
      accessToken: this.tokens.signAccess(admin)
    };
  }
}

export class GetCurrentAdminUseCase {
  constructor(private readonly admins: IAdminRepository) {}

  async execute(adminId: string) {
    const admin = await this.admins.findById(adminId);
    if (!admin) {
      throw new Error("Admin account no longer exists.");
    }

    return sanitizeAdmin(admin);
  }
}

export function sanitizeAdmin(admin: Admin) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    lastLoginAt: admin.lastLoginAt
  };
}
