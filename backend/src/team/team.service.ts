import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTeamDto, UpdateTeamDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { TeamEntity } from './entities/team.entity';

@Injectable()
export class TeamService {
  constructor(private prismaService: PrismaService) {}

  async create(createTeamDto: CreateTeamDto): Promise<TeamEntity> {
    return await this.prismaService.team.create({
      data: createTeamDto,
      select: {
        id: true,
        name: true,
        robotName: true,
        idCategory: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(): Promise<TeamEntity[]> {
    return await this.prismaService.team.findMany({
      select: {
        id: true,
        name: true,
        robotName: true,
        idCategory: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: number): Promise<TeamEntity> {
    const team = await this.prismaService.team.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        robotName: true,
        idCategory: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  async update(id: number, updateTeamDto: UpdateTeamDto): Promise<TeamEntity> {
    const team = await this.prismaService.team.findUnique({
      where: { id },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return await this.prismaService.team.update({
      where: { id },
      data: updateTeamDto,
      select: {
        id: true,
        name: true,
        robotName: true,
        idCategory: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: number): Promise<boolean> {
    const team = await this.prismaService.team.findUnique({
      where: { id },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    await this.prismaService.team.delete({
      where: { id },
    });

    return true;
  }

  async linkUserToTeam(userId: number, teamId: number): Promise<boolean> {
    const team = await this.prismaService.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prismaService.usersOnTeams.create({
      data: {
        idUser: userId,
        idTeam: teamId,
      },
    });

    return true;
  }
}
