import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service.js';
import { I18nService } from '../i18n/i18n.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  private guestEmail: string;

  constructor(
    private supabaseService: SupabaseService,
    private i18n: I18nService,
    private configService: ConfigService,
  ) {
    this.guestEmail = this.configService.get<string>('GUEST_EMAIL', '');
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    if (error) {
      throw new UnauthorizedException(this.i18n.t('INVALID_CREDENTIALS'));
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        isGuest: !!this.guestEmail && data.user.email === this.guestEmail,
      },
    };
  }

  async refresh(refreshToken: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      throw new UnauthorizedException(this.i18n.t('INVALID_REFRESH_TOKEN'));
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user!.id,
        email: data.user!.email,
        isGuest: !!this.guestEmail && data.user!.email === this.guestEmail,
      },
    };
  }

  async logout(token: string) {
    const client = this.supabaseService.getClientWithToken(token);
    await client.auth.signOut();
    return { success: true };
  }
}
