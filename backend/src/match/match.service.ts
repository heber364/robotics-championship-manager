import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMatchDto, UpdateMatchDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { MatchEntity } from './entities/match.entity';
import { MatchStatus } from '@prisma/client';
import { UpdateMatchStatusDto } from './dto';
import { Role } from '../common/enums';
import { UpdateMatchResultDto } from './dto';

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
        observation: createMatchDto.observation,
      },
      select: {
        id: true,
        idTeamA: true,
        idTeamB: true,
        idArena: true,
        date: true,
        status: true,
        startTime: true,
        endTime: true,
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
        startTime: true,
        endTime: true,
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
        teamA: true,
        idTeamB: true,
        teamB: true,
        idArena: true,
        arena: true,
        date: true,
        status: true,
        startTime: true,
        endTime: true,
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
        startTime: true,
        endTime: true,
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

  async startMatch(matchId: number) {
    const match = await this.prismaService.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException('Can only start matches that are scheduled');
    }

    return this.prismaService.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.IN_PROGRESS,
        startTime: new Date(),
      },
      select: {
        id: true,
        idTeamA: true,
        idTeamB: true,
        idArena: true,
        date: true,
        status: true,
        startTime: true,
        endTime: true,
        observation: true,
        matchResult: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async pauseMatch(matchId: number) {
    const match = await this.prismaService.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only pause matches that are in progress');
    }

    return this.prismaService.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.SCHEDULED,
      },
      select: {
        id: true,
        idTeamA: true,
        idTeamB: true,
        idArena: true,
        date: true,
        status: true,
        startTime: true,
        endTime: true,
        observation: true,
        matchResult: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async endMatch(matchId: number) {
    const match = await this.prismaService.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status === MatchStatus.FINISHED) {
      throw new BadRequestException('Match is already finished');
    }

    if (match.status === MatchStatus.CANCELLED) {
      throw new BadRequestException('Cannot end a cancelled match');
    }

    return this.prismaService.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.FINISHED,
        endTime: new Date(),
      },
      select: {
        id: true,
        idTeamA: true,
        idTeamB: true,
        idArena: true,
        date: true,
        status: true,
        startTime: true,
        endTime: true,
        observation: true,
        matchResult: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateMatchResult(matchId: number, updateMatchResultDto: UpdateMatchResultDto) {
    const match = await this.prismaService.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only update result for matches in progress');
    }

    return this.prismaService.match.update({
      where: { id: matchId },
      data: {
        matchResult: updateMatchResultDto.result,
      },
      select: {
        id: true,
        idTeamA: true,
        idTeamB: true,
        idArena: true,
        date: true,
        status: true,
        startTime: true,
        endTime: true,
        observation: true,
        matchResult: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
