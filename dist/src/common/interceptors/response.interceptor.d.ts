import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface Response<T> {
    success: boolean;
    message: string;
    data: T;
    meta?: any;
    errors: any[];
}
export declare class GlobalResponseInterceptor<T> implements NestInterceptor<T, Response<T> | any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T> | any>;
}
