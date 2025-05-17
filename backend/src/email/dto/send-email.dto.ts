import { IsEmail, IsNotEmpty, IsString, IsArray, ValidateNested, IsOptional, Validate } from "class-validator";
import { Type } from "class-transformer";
import { Address } from 'nodemailer/lib/mailer';
import { IsRecipientValid } from "../validators/recipient.validator";


export class AddressDto implements Address {
  @IsEmail()
  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}

export class SendEmailDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  sender?: AddressDto;

  @Validate(IsRecipientValid)
  recipients: string | string[] | AddressDto | AddressDto[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  html: string;

  @IsOptional()
  @IsString()
  text?: string;
}