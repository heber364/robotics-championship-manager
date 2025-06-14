import { ApiProperty } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';

export class UserEntity
  implements
    Omit<
      User,
      | 'hash'
      | 'hashRt'
      | 'emailVerified'
      | 'emailVerificationToken'
      | 'emailVerificationTokenExpiresAt'
    >
{
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: Role})
  role: Role;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
  
}
