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
        category: true,
        users: true,
        matchesA: true,
        matchesB: true,
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
}
