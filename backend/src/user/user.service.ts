import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { Role } from '../common/enums';
import { UpdateUserRoleDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async findAll(): Promise<UserEntity[]> {
    return await this.prismaService.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        teams: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserRoles(
    currentUserId: number,
    targetUserId: number,
    updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<UserEntity> {
    const currentUser = await this.findOne(currentUserId);
    const targetUser = await this.findOne(targetUserId);

    if (currentUserId === targetUserId) {
      throw new ForbiddenException('You cannot update your own role');
    }

    if (
      currentUser.role === Role.ADMIN &&
      (targetUser.role === Role.SUPER_ADMIN || targetUser.role === Role.ADMIN)
    ) {
      throw new ForbiddenException('Admins cannot update role of other admins or super admins');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: targetUserId },
      data: {
        role: updateUserRoleDto.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async transferSuperAdmin(currentUserId: number, newSuperAdminId: number): Promise<UserEntity> {
    if (currentUserId === newSuperAdminId) {
      throw new ForbiddenException('You cannot transfer super admin role to yourself');
    }

    const updatedNewSuperAdmin = await this.prismaService.user.update({
      where: { id: newSuperAdminId },
      data: {
        role: Role.SUPER_ADMIN,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.prismaService.user.update({
      where: { id: currentUserId },
      data: {
        role: Role.ADMIN,
      },
    });

    return updatedNewSuperAdmin;
  }
}
