import { Controller, Get, Param, ParseIntPipe, Patch, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';
import { GetCurrentUserId, Roles } from '../common/decorators';
import { UpdateUserRoleDto } from './dto';
import { Role } from 'src/common/enums';

@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOkResponse({ type: UserEntity })
  me(@GetCurrentUserId() userId: number) {
    return this.userService.findOne(userId);
  }

  @Get()
  @ApiOkResponse({ type: [UserEntity] })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: UserEntity })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id/roles')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: UserEntity })
  updateUserRoles(
    @GetCurrentUserId() currentUserId: number,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.userService.updateUserRoles(currentUserId, targetUserId, updateUserRoleDto);
  }

  @Patch(':id/transfer-super-admin')
  @Roles(Role.SUPER_ADMIN)
  @ApiOkResponse({ type: UserEntity })
  transferSuperAdmin(
    @GetCurrentUserId() currentUserId: number,
    @Param('id', ParseIntPipe) newSuperAdminId: number,
  ) {
    return this.userService.transferSuperAdmin(currentUserId, newSuperAdminId);
  }
}
