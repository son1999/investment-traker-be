import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { en } from './translations/en.js';
import { vi } from './translations/vi.js';

type TranslationKey = keyof typeof en;
type Translations = Record<string, Record<string, string>>;

const translations: Translations = { en, vi };

@Injectable()
export class I18nService {
  private static storage = new AsyncLocalStorage<string>();

  static run(lang: string, fn: () => void) {
    I18nService.storage.run(lang, fn);
  }

  private getLang(): string {
    return I18nService.storage.getStore() || 'en';
  }

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const lang = this.getLang();
    const dict = translations[lang] || translations['en'];
    let message = dict[key] || translations['en'][key] || key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        message = message.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return message;
  }
}
