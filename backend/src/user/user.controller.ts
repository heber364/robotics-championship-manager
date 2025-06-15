import { Controller, Get, Param, ParseIntPipe, Patch, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';
import { GetCurrentUserId, Roles } from '../common/decorators';
import { UpdateUserRoleDto } from './dto';
import { Role } from '../common/enums';

@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOkResponse({ type: UserEntity })
  async me(@GetCurrentUserId() userId: number): Promise<UserEntity> {
    return await this.userService.findOne(userId);
  }

  @Get()
  @ApiOkResponse({ type: [UserEntity] })
  async findAll(): Promise<UserEntity[]> {
    return await this.userService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: UserEntity })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    return await this.userService.findOne(id);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: UserEntity })
  async updateUserRoles(
    @GetCurrentUserId() currentUserId: number,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<UserEntity> {
    return await this.userService.updateUserRoles(currentUserId, targetUserId, updateUserRoleDto);
  }

  @Patch(':id/transfer-super-admin')
  @Roles(Role.SUPER_ADMIN)
  @ApiOkResponse({ type: UserEntity })
  async transferSuperAdmin(
    @GetCurrentUserId() currentUserId: number,
    @Param('id', ParseIntPipe) newSuperAdminId: number,
  ): Promise<UserEntity> {
    return await this.userService.transferSuperAdmin(currentUserId, newSuperAdminId);
  }
}
