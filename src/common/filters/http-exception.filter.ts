import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from '../../i18n/i18n.service.js';

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = this.i18n.t('INTERNAL_SERVER_ERROR');
    let error = this.i18n.t('INTERNAL_SERVER_ERROR');

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, any>;
        message = resp.message || message;
        error = resp.error || error;
      }
      error = this.getErrorName(status);
    }

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      error,
    });
  }

  private getErrorName(status: number): string {
    const names: Record<number, string> = {
      400: this.i18n.t('BAD_REQUEST'),
      401: this.i18n.t('UNAUTHORIZED'),
      403: this.i18n.t('FORBIDDEN'),
      404: this.i18n.t('NOT_FOUND'),
      409: this.i18n.t('CONFLICT'),
      500: this.i18n.t('INTERNAL_SERVER_ERROR'),
    };
    return names[status] || 'Error';
  }
}
