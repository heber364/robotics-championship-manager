import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: Record<string, unknown> = {};

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const field = exception.meta?.target?.[0];
        message = `A record with this ${field} already exists`;
        details = {
          field,

          value: exception.meta?.target?.[0],
        };
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;

        const constraint = exception.meta?.constraint as string;
        // Extract the referenced model from the constraint name (e.g., "arenas_id_category_fkey" -> "Category")
        const parts = constraint.split('_');
        const modelPart = parts[parts.length - 2]; // Get the second to last part
        const referencedModel = modelPart
          ? modelPart.charAt(0).toUpperCase() + modelPart.slice(1)
          : 'Entity';

        message = `The referenced ${referencedModel} does not exist`;
        details = {
          model: exception.meta?.modelName,
          constraint,
          referencedModel,
        };
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        details = {
          model: exception.meta?.model_name,
        };
        break;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.code,
      details,
    });
  }
}
