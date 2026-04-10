import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from '../../i18n/i18n.service.js';

export const ALLOW_GUEST_WRITE = 'allowGuestWrite';

/**
 * Blocks write operations (POST/PATCH/PUT/DELETE) for guest users.
 * Use @AllowGuestWrite() decorator to whitelist specific endpoints.
 */
@Injectable()
export class GuestWriteGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private i18n: I18nService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.isGuest) return true;

    const method = request.method.toUpperCase();
    if (method === 'GET') return true;

    // Check if endpoint is whitelisted for guest write
    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOW_GUEST_WRITE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowed) return true;

    throw new ForbiddenException(this.i18n.t('GUEST_READ_ONLY'));
  }
}
