import {
  type ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { BaseErrorResponse, BaseExceptionResponse } from '../base.response';
import { SentryExceptionCaptured } from '@sentry/nestjs';

function toCamelCase(str: unknown): string {
  const normalized = (typeof str === 'string' ? str : '').trim().toLowerCase();

  // Replace any space followed by a letter with the uppercase version of the letter
  return normalized.replace(/\s+(.)/g, (_match, group1: string) =>
    group1.toUpperCase(),
  );
}

interface PostgresQueryFailedError extends QueryFailedError {
  code?: string;
  detail?: string;
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor() {}

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Set the status code.
    const isHttpException = exception instanceof HttpException;
    let status: number = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Set the message to be displayed in the response.
    let message = isHttpException
      ? exception.getResponse()
      : new BaseExceptionResponse(
          'internalServerError',
          'Server error occurred.',
        );

    // Set the error detail to be displayed in the log.
    let errorDetails: string;
    errorDetails = isHttpException
      ? JSON.stringify(exception.getResponse())
      : '';

    // Handle Unique Constraint Error (23505 - PostgreSQL)
    if (
      exception instanceof QueryFailedError &&
      (exception as PostgresQueryFailedError).code === '23505'
    ) {
      const detailMessage =
        (exception as PostgresQueryFailedError).detail ?? '';
      const match = /\((.*?)\)=\((.*?)\)/.exec(detailMessage);

      const conflictKeys: string[] = match
        ? match[1]
            .split(',')
            .map((field: string): string => field.trim().replace(/"/g, ''))
        : ['Unknown Field'];

      status = HttpStatus.CONFLICT;
      const message: BaseExceptionResponse[] = [];

      for (const conflictKey of conflictKeys) {
        message.push(
          new BaseExceptionResponse(
            'conflictError',
            `Data sudah ada. Konflik pada field: ${conflictKey}.`,
            conflictKey,
          ),
        );
      }
      errorDetails = exception.message;

      response.status(status).json({
        type: 'conflictError',
        errors: message,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    const isObject = typeof message === 'object';
    let isBaseExceptionFormat: boolean =
      message instanceof BaseExceptionResponse;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (isHttpException && status === HttpStatus.BAD_REQUEST) {
      const responseBody = exception.getResponse();
      const responseMessage =
        typeof responseBody === 'object' &&
        responseBody !== null &&
        'message' in responseBody
          ? responseBody.message
          : undefined;

      // Format response untuk validationError
      response.status(status).json({
        type: 'validationError',
        errors: Array.isArray(responseMessage)
          ? responseMessage
          : [responseMessage ?? responseBody],
        timestamp: new Date().toISOString(),
      });

      return;
    }

    if (!isBaseExceptionFormat) {
      if (Array.isArray(message)) {
        isBaseExceptionFormat = message[0] instanceof BaseExceptionResponse;
      } else {
        const messageObject = isObject
          ? (message as Record<string, unknown>)
          : {};
        message = new BaseExceptionResponse(
          isObject ? toCamelCase(messageObject.error) : 'internalServerError',
          messageObject.message as string,
        );
        errorDetails = JSON.stringify(message);
        isBaseExceptionFormat = true;
      }
    }

    // Check if the message is an object and not an instance of BaseExceptionResponse
    // If true then it will be recognized as an internal server error because the message is non standard.
    if (isObject && !isBaseExceptionFormat) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorDetails = 'Standard error exception is not implemented correctly.';
      message = new BaseExceptionResponse(
        'internalServerError',
        'Server error occurred.',
      );
    }

    let type: string;
    switch (status) {
      case 400:
        type = 'validationError';
        break;
      case 409:
        type = 'conflictError';
        break;
      case 500:
        type = 'serverError';
        if (!errorDetails) {
          errorDetails = exception instanceof Error ? exception.message : '';
        }
        break;
      default:
        type = 'clientError';
    }

    const result = new BaseErrorResponse(
      type,
      Array.isArray(message) ? message : [message],
      `${request.method} ${request.url}`,
    );

    response.status(status).json(result);
  }
}
