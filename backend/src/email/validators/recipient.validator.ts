import {
  IsEmail,
  IsNotEmpty,
  IsString,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  isEmail,
  validateSync,
} from 'class-validator';

import { Address } from 'nodemailer/lib/mailer';

export class AddressDto implements Address {
  @IsEmail()
  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}

@ValidatorConstraint({ name: 'IsRecipientValid', async: false })
export class IsRecipientValid implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (typeof value === 'string') {
      return isEmail(value);
    }
    if (Array.isArray(value)) {
      return value.every(
        (v) =>
          (typeof v === 'string' && isEmail(v)) ||
          (typeof v === 'object' &&
            v !== null &&
            'address' in v &&
            isEmail(v.address) &&
            this.isValidAddressDto(v)),
      );
    }
    // objeto AddressDto
    return (
      typeof value === 'object' &&
      value !== null &&
      'address' in value &&
      isEmail(value.address) &&
      this.isValidAddressDto(value)
    );
  }

  isValidAddressDto(obj: any) {
    const dto = Object.assign(new AddressDto(), obj);
    const errors = validateSync(dto);
    return errors.length === 0;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'recipients deve ser um email, array de emails, AddressDto válido ou array de AddressDto válidos';
  }
}
