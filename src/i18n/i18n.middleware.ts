import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { I18nService } from './i18n.service.js';

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const acceptLang = req.headers['accept-language'] || 'en';
    const lang = acceptLang.split(',')[0].split('-')[0].trim().toLowerCase();
    const supported = lang === 'vi' ? 'vi' : 'en';

    I18nService.run(supported, () => next());
  }
}
