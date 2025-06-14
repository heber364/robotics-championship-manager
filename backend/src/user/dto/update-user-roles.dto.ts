import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum } from 'class-validator';
import { Role } from '../../common/enums';

export class UpdateUserRolesDto {
  @ApiProperty({ enum: Role, isArray: true })
  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];
} 