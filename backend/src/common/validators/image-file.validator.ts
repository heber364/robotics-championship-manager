import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';

@Injectable()
export class ImageFileValidationPipe implements PipeTransform {
  private readonly maxSize: number;
  private readonly fileTypes: (string | RegExp)[];

  constructor(options: {
    maxSize: number;
    fileType: string | RegExp | (string | RegExp)[];
  }) {
    this.maxSize = options.maxSize;
    this.fileTypes = Array.isArray(options.fileType)
      ? options.fileType
      : [options.fileType];
  }

  async transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException('File should not be empty');
    }

    const maxFileSizeValidator = new MaxFileSizeValidator({
      maxSize: this.maxSize,
    });
    if (!maxFileSizeValidator.isValid(value)) {
      throw new BadRequestException(
        `Validation failed (expected size is less than ${this.maxSize})`,
      );
    }

    const fileTypeIsValid = this.fileTypes.some((fileType) => {
      const fileTypeValidator = new FileTypeValidator({ fileType });
      return fileTypeValidator.isValid(value);
    });

    if (!fileTypeIsValid) {
      throw new BadRequestException(
        `Validation failed (expected type is one of ${this.fileTypes.join(
          ', ',
        )})`,
      );
    }

    return value;
  }
}
