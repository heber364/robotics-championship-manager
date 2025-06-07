import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MatchEntity } from './entities/match.entity';

@Injectable()
export class MatchService {
  constructor(private prismaService: PrismaService) {}

  async create(createMatchDto: CreateMatchDto): Promise<MatchEntity> {
    return await this.prismaService.match.create({
      data: {
        idTeamA: createMatchDto.idTeamA,
        idTeamB: createMatchDto.idTeamB,
        idArena: createMatchDto.idArena,
        date: createMatchDto.date,
        status: createMatchDto.status,
        observation: createMatchDto.observation,
        matchResult: createMatchDto.matchResult,
      },
      select: {
        id: true,
        idTeamA: true,
        idTeamB: true,
        idArena: true,
        date: true,
        status: true,
        observation: true,
        matchResult: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(): Promise<MatchEntity[]> {
    return await this.prismaService.match.findMany({
      select: {
        id: true,
        idTeamA: true,
        idTeamB: true,
        idArena: true,
        date: true,
        status: true,
        observation: true,
        matchResult: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: number): Promise<MatchEntity> {
    const match = await this.prismaService.match.findUnique({
      where: { id },
      select: {
        id: true,
        idTeamA: true,
        idTeamB: true,
        idArena: true,
        date: true,
        status: true,
        observation: true,
        matchResult: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }
    return match;
  }

  async update(id: number, updateMatchDto: UpdateMatchDto): Promise<MatchEntity> {
    const match = await this.prismaService.match.findUnique({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return await this.prismaService.match.update({
      where: { id },
      data: updateMatchDto,
      select: {
        id: true,
        idTeamA: true,
        idTeamB: true,
        idArena: true,
        date: true,
        status: true,
        observation: true,
        matchResult: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: number): Promise<boolean> {
    const match = await this.prismaService.match.findUnique({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    await this.prismaService.match.delete({
      where: { id },
    });

    return true;
  }
}
