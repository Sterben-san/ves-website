import type { Admin, StoredAsset } from "./entities";

export interface IPasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export interface ITokenService {
  signAccess(admin: Admin): string;
  signRefresh(admin: Admin): string;
  verifyAccess(token: string): { adminId: string; email: string };
  verifyRefresh(token: string): { adminId: string; email: string };
}

export interface IStorageService {
  upload(input: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    folder: string;
  }): Promise<StoredAsset>;
  delete(publicId: string): Promise<void>;
}
