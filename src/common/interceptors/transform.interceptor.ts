import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((result) => {
        // If result already has 'data' key (e.g., paginated responses with meta), return as-is
        if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
          return result;
        }
        // If result already has 'data' key only, return as-is
        if (result && typeof result === 'object' && 'data' in result && Object.keys(result).length <= 2) {
          return result;
        }
        return { data: result };
      }),
    );
  }
}
