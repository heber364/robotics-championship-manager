import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMatchDto, UpdateMatchDto, UpdateMatchScoreDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { TeamIdentifier } from './dto/update-match-score.dto';
import { MatchEntity } from './entities/match.entity';
import { MatchGateway } from './match.gateway';
import { MatchStatus } from './enums/match-status.enum';

@Injectable()
export class MatchService {
  constructor(
    private prismaService: PrismaService,
    private readonly matchGateway: MatchGateway,
  ) {}

  async create(createMatchDto: CreateMatchDto): Promise<MatchEntity> {
    return await this.prismaService.match.create({
      data: {
        idTeamA: createMatchDto.idTeamA,
        idTeamB: createMatchDto.idTeamB,
        idArena: createMatchDto.idArena,
        date: createMatchDto.date,
        observation: createMatchDto.observation,
        idJudge: createMatchDto.idJudge,
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
        teamAScore: true,
        teamBScore: true,
        idJudge: true,
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
        teamAScore: true,
        teamBScore: true,
        idJudge: true,
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
        teamAScore: true,
        teamBScore: true,
        idJudge: true,
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

    const updatedMatch = await this.prismaService.match.update({
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
        teamAScore: true,
        teamBScore: true,
        idJudge: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.matchGateway.broadcastMatchUpdate(id, updatedMatch);

    return updatedMatch;
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

  async startMatch(id: number, judgeId: number) {
    const match = await this.prismaService.match.findUnique({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.idJudge !== judgeId) {
      throw new UnauthorizedException('You are not authorized to start this match.');
    }

    if (match.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException('Can only start matches that are scheduled');
    }

    const updatedMatch = await this.prismaService.match.update({
      where: { id },
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
        teamAScore: true,
        teamBScore: true,
        idJudge: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.matchGateway.broadcastMatchUpdate(id, updatedMatch);
  }

  async pauseMatch(id: number, judgeId: number) {
    const match = await this.prismaService.match.findUnique({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.idJudge !== judgeId) {
      throw new UnauthorizedException('You are not authorized to pause this match.');
    }

    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only pause matches that are in progress');
    }

    const updatedMatch = await this.prismaService.match.update({
      where: { id },
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
        teamAScore: true,
        teamBScore: true,
        idJudge: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    this.matchGateway.broadcastMatchUpdate(id, updatedMatch);
    return updatedMatch;
  }

  async endMatch(id: number, judgeId: number) {
    const match = await this.prismaService.match.findUnique({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.idJudge !== judgeId) {
      throw new UnauthorizedException('You are not authorized to end this match.');
    }

    if (match.status === MatchStatus.FINISHED) {
      throw new BadRequestException('Match is already finished');
    }

    if (match.status === MatchStatus.CANCELLED) {
      throw new BadRequestException('Cannot end a cancelled match');
    }

    const updatedMatch = await this.prismaService.match.update({
      where: { id },
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
        teamAScore: true,
        teamBScore: true,
        idJudge: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.matchGateway.broadcastMatchUpdate(id, updatedMatch);
    return updatedMatch;
  }

  async updateMatchScore(id: number, updateMatchScoreDto: UpdateMatchScoreDto, judgeId: number) {
    const match = await this.prismaService.match.findUnique({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.idJudge !== judgeId) {
      throw new UnauthorizedException('You are not authorized to update the score for this match.');
    }

    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only update score for matches in progress');
    }

    const scoreFieldMap = {
      [TeamIdentifier.A]: 'teamAScore',
      [TeamIdentifier.B]: 'teamBScore',
    };

    const fieldToUpdate = scoreFieldMap[updateMatchScoreDto.team];

    const updatedMatch = await this.prismaService.match.update({
      where: { id },
      data: {
        [fieldToUpdate]: updateMatchScoreDto.score,
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
        teamAScore: true,
        teamBScore: true,
        idJudge: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.matchGateway.broadcastMatchUpdate(id, updatedMatch);
    return updatedMatch;
  }
}
