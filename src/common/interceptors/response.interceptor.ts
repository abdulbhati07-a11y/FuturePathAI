import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
  errors: any[];
}

@Injectable()
export class GlobalResponseInterceptor<T> implements NestInterceptor<
  T,
  Response<T> | any
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    // If the route is an SSE route, it usually sets content-type to text/event-stream
    // Or we can bypass based on a custom decorator if needed.
    // For now, if headers say it's event-stream, bypass wrapping.

    return next.handle().pipe(
      map((data) => {
        if (
          response.getHeader &&
          response.getHeader('content-type') === 'text/event-stream'
        ) {
          return data; // Do not wrap SSE
        }

        // Handle paginated responses
        if (data && data.meta && data.data) {
          return {
            success: true,
            message: 'Success',
            data: data.data,
            meta: data.meta,
            errors: [],
          };
        }

        // Handle standard responses
        return {
          success: true,
          message: 'Success',
          data: data !== undefined ? data : null,
          errors: [],
        };
      }),
    );
  }
}
