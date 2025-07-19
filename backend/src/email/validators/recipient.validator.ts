import {
  IsEmail,
  IsNotEmpty,
  IsString,
  ValidatorConstraint,
  ValidatorConstraintInterface,
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
  validate(value: unknown): boolean {
    if (typeof value === 'string') {
      return isEmail(value);
    }

    if (Array.isArray(value)) {
      // Validate each item in the array.
      // An item can be a string (email) or a valid AddressDto object.
      return value.every(
        (item: unknown) =>
          (typeof item === 'string' && isEmail(item)) || this.isValidAddressDto(item),
      );
    }

    // If it's not a string or an array, it must be a single AddressDto object.
    return this.isValidAddressDto(value);
  }

  /**
   * Checks if an unknown value is a valid AddressDto object.
   * This method safely handles type checking and validation.
   * @param obj The value to validate.
   * @returns True if the object is a valid AddressDto, otherwise false.
   */
  isValidAddressDto(obj: unknown): boolean {
    // An AddressDto must be a non-null object.
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    // To safely handle the unknown object, we create a new AddressDto instance
    // and manually assign the properties after checking their types.
    const addressDto = new AddressDto();
    const potentialDto = obj as Record<string, unknown>;

    addressDto.address = typeof potentialDto.address === 'string' ? potentialDto.address : '';
    addressDto.name = typeof potentialDto.name === 'string' ? potentialDto.name : '';

    // `validateSync` now receives a correctly typed object.
    // The validators (@IsEmail, @IsNotEmpty) will catch any invalid values.
    const errors = validateSync(addressDto);
    return errors.length === 0;
  }

  defaultMessage(): string {
    return 'recipients must be a valid email, an array of emails, a valid AddressDto, or an array of valid AddressDtos';
  }
}
