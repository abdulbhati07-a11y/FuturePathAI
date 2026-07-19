import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse.message || message;
        // Handle class-validator error arrays
        if (Array.isArray(exceptionResponse.message)) {
          message = 'Validation failed';
          errors = exceptionResponse.message.map((msg: any) => ({
            message: msg,
          }));
        } else {
          errors = [{ message }];
        }
      } else {
        message = exceptionResponse;
        errors = [{ message }];
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errors = [{ message }];
    }

    // TODO: Winston logger integration here

    response.status(status).json({
      success: false,
      message,
      data: null,
      errors,
    });
  }
}
