import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { I18nService } from '../../i18n/i18n.service.js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private guestEmail: string;

  constructor(
    private supabaseService: SupabaseService,
    private i18n: I18nService,
    private configService: ConfigService,
  ) {
    this.guestEmail = this.configService.get<string>('GUEST_EMAIL', '');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(this.i18n.t('MISSING_AUTH_HEADER'));
    }

    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await this.supabaseService.getClient().auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException(this.i18n.t('INVALID_TOKEN'));
    }

    request.user = {
      id: data.user.id,
      email: data.user.email,
      token,
      isGuest: !!this.guestEmail && data.user.email === this.guestEmail,
    };

    return true;
  }
}
