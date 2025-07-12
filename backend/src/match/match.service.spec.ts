import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from './match.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto, UpdateMatchDto, UpdateMatchScoreDto } from './dto';
import { Prisma } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MatchGateway } from './match.gateway';
import { MatchStatus } from './enums/match-status.enum';
import { TeamIdentifier } from './dto/update-match-score.dto';
import { MatchEntity } from './entities/match.entity';

const mockMatch: MatchEntity = {
  id: 1,
  idTeamA: 1,
  idTeamB: 2,
  idArena: 1,
  idJudge: 1,
  date: new Date(),
  status: MatchStatus.SCHEDULED,
  observation: 'Test observation',
  teamAScore: 0,
  teamBScore: 0,
  startTime: null,
  endTime: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const matchSelect = {
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
};

describe('MatchService', () => {
  let matchService: MatchService;

  const mockPrismaService = {
    match: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockMatchGateway = {
    broadcastMatchUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MatchGateway,
          useValue: mockMatchGateway,
        },
      ],
    }).compile();

    matchService = module.get<MatchService>(MatchService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(matchService).toBeDefined();
  });

  describe('create', () => {
    const createMatchDto: CreateMatchDto = {
      idTeamA: 1,
      idTeamB: 2,
      idArena: 1,
      idJudge: 1,
      date: new Date(),
      observation: 'Test observation',
    };

    it('should create a match successfully', async () => {
      mockPrismaService.match.create.mockResolvedValueOnce(mockMatch);

      const result = await matchService.create(createMatchDto);

      expect(result).toEqual(mockMatch);
      expect(mockPrismaService.match.create).toHaveBeenCalledWith({
        data: createMatchDto,
        select: matchSelect,
      });
    });

    it('should throw PrismaClientKnownRequestError on foreign key constraint failure', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0',
        meta: {},
       });


      mockPrismaService.match.create.mockRejectedValueOnce(error);

      await expect(matchService.create(createMatchDto)).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });
  });

  describe('findAll', () => {
    it('should return an array of matches', async () => {
      mockPrismaService.match.findMany.mockResolvedValueOnce([mockMatch]);

      const result = await matchService.findAll();

      expect(result).toEqual([mockMatch]);
      expect(mockPrismaService.match.findMany).toHaveBeenCalledWith({
        select: matchSelect,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single match by id', async () => {
      const extendedMatch = { ...mockMatch, teamA: {}, teamB: {}, arena: {} };
      mockPrismaService.match.findUnique.mockResolvedValueOnce(extendedMatch);

      const result = await matchService.findOne(1);

      expect(result).toEqual(extendedMatch);
      expect(mockPrismaService.match.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          ...matchSelect,
          teamA: true,
          teamB: true,
          arena: true,
        },
      });
    });

    it('should throw NotFoundException if match is not found', async () => {
      mockPrismaService.match.findUnique.mockResolvedValueOnce(null);

      await expect(matchService.findOne(1)).rejects.toThrow(new NotFoundException('Match not found'));
    });
  });

  describe('update', () => {
    const updateMatchDto: UpdateMatchDto = { observation: 'Updated observation' };

    it('should update a match and broadcast the update', async () => {
      const updatedMatch = { ...mockMatch, ...updateMatchDto };
      mockPrismaService.match.findUnique.mockResolvedValueOnce(mockMatch);
      mockPrismaService.match.update.mockResolvedValueOnce(updatedMatch);

      const result = await matchService.update(1, updateMatchDto);

      expect(result).toEqual(updatedMatch);
      expect(mockPrismaService.match.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateMatchDto,
        select: matchSelect,
      });
      expect(mockMatchGateway.broadcastMatchUpdate).toHaveBeenCalledWith(1, updatedMatch);
    });

    it('should throw NotFoundException if match to update is not found', async () => {
      mockPrismaService.match.findUnique.mockResolvedValueOnce(null);

      await expect(matchService.update(1, updateMatchDto)).rejects.toThrow(new NotFoundException('Match not found'));
      expect(mockMatchGateway.broadcastMatchUpdate).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a match successfully', async () => {
      mockPrismaService.match.findUnique.mockResolvedValueOnce(mockMatch);
      mockPrismaService.match.delete.mockResolvedValueOnce(mockMatch);

      const result = await matchService.remove(1);

      expect(result).toBe(true);
      expect(mockPrismaService.match.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockPrismaService.match.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if match to remove is not found', async () => {
      mockPrismaService.match.findUnique.mockResolvedValueOnce(null);
      await expect(matchService.remove(1)).rejects.toThrow(new NotFoundException('Match not found'));
    });
  });

  describe('startMatch', () => {
    it('should start a scheduled match and broadcast the update', async () => {
      const scheduledMatch = { ...mockMatch, status: MatchStatus.SCHEDULED };
      const startedMatch = { ...mockMatch, status: MatchStatus.IN_PROGRESS, startTime: expect.any(Date) };
      
      mockPrismaService.match.findUnique.mockResolvedValueOnce(scheduledMatch);
      mockPrismaService.match.update.mockResolvedValueOnce(startedMatch);

      await matchService.startMatch(1);

      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: MatchStatus.IN_PROGRESS, startTime: expect.any(Date) },
        select: matchSelect,
      });
      expect(mockMatchGateway.broadcastMatchUpdate).toHaveBeenCalledWith(1, startedMatch);
    });

    it('should throw BadRequestException if match is not scheduled', async () => {
      const inProgressMatch = { ...mockMatch, status: MatchStatus.IN_PROGRESS };
      mockPrismaService.match.findUnique.mockResolvedValueOnce(inProgressMatch);

      await expect(matchService.startMatch(1)).rejects.toThrow(new BadRequestException('Can only start matches that are scheduled'));
    });
  });

  describe('pauseMatch', () => {
    it('should pause an in-progress match and broadcast the update', async () => {
        const inProgressMatch = { ...mockMatch, status: MatchStatus.IN_PROGRESS };
        const pausedMatch = { ...mockMatch, status: MatchStatus.SCHEDULED };

        mockPrismaService.match.findUnique.mockResolvedValueOnce(inProgressMatch);
        mockPrismaService.match.update.mockResolvedValueOnce(pausedMatch);

        const result = await matchService.pauseMatch(1);

        expect(result).toEqual(pausedMatch);
        expect(mockPrismaService.match.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { status: MatchStatus.SCHEDULED },
            select: matchSelect,
        });
        expect(mockMatchGateway.broadcastMatchUpdate).toHaveBeenCalledWith(1, pausedMatch);
    });

    it('should throw BadRequestException if match is not in progress', async () => {
        const scheduledMatch = { ...mockMatch, status: MatchStatus.SCHEDULED };
        mockPrismaService.match.findUnique.mockResolvedValueOnce(scheduledMatch);
        
        await expect(matchService.pauseMatch(1)).rejects.toThrow(new BadRequestException('Can only pause matches that are in progress'));
    });
  });

  describe('endMatch', () => {
    it('should end an in-progress match and broadcast the update', async () => {
        const inProgressMatch = { ...mockMatch, status: MatchStatus.IN_PROGRESS };
        const finishedMatch = { ...mockMatch, status: MatchStatus.FINISHED, endTime: expect.any(Date) };

        mockPrismaService.match.findUnique.mockResolvedValueOnce(inProgressMatch);
        mockPrismaService.match.update.mockResolvedValueOnce(finishedMatch);
        
        const result = await matchService.endMatch(1);

        expect(result).toEqual(finishedMatch);
        expect(mockPrismaService.match.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { status: MatchStatus.FINISHED, endTime: expect.any(Date) },
            select: matchSelect,
        });
        expect(mockMatchGateway.broadcastMatchUpdate).toHaveBeenCalledWith(1, finishedMatch);
    });

    it('should throw BadRequestException if match is already finished', async () => {
        const finishedMatch = { ...mockMatch, status: MatchStatus.FINISHED };
        mockPrismaService.match.findUnique.mockResolvedValueOnce(finishedMatch);
        
        await expect(matchService.endMatch(1)).rejects.toThrow(new BadRequestException('Match is already finished'));
    });
  });

  describe('updateMatchScore', () => {
    const inProgressMatch = { ...mockMatch, status: MatchStatus.IN_PROGRESS };

    it("should update team A's score and broadcast the update", async () => {
        const updateDto: UpdateMatchScoreDto = { team: TeamIdentifier.A, score: 10 };
        const updatedMatch = { ...inProgressMatch, teamAScore: 10 };

        mockPrismaService.match.findUnique.mockResolvedValueOnce(inProgressMatch);
        mockPrismaService.match.update.mockResolvedValueOnce(updatedMatch);
        
        const result = await matchService.updateMatchScore(1, updateDto);

        expect(result).toEqual(updatedMatch);
        expect(mockPrismaService.match.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { teamAScore: 10 },
            select: matchSelect,
        });
        expect(mockMatchGateway.broadcastMatchUpdate).toHaveBeenCalledWith(1, updatedMatch);
    });

    it("should update team B's score and broadcast the update", async () => {
        const updateDto: UpdateMatchScoreDto = { team: TeamIdentifier.B, score: 5 };
        const updatedMatch = { ...inProgressMatch, teamBScore: 5 };

        mockPrismaService.match.findUnique.mockResolvedValueOnce(inProgressMatch);
        mockPrismaService.match.update.mockResolvedValueOnce(updatedMatch);

        const result = await matchService.updateMatchScore(1, updateDto);

        expect(result).toEqual(updatedMatch);
        expect(mockPrismaService.match.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { teamBScore: 5 },
            select: matchSelect,
        });
        expect(mockMatchGateway.broadcastMatchUpdate).toHaveBeenCalledWith(1, updatedMatch);
    });

    it('should throw BadRequestException if match is not in progress', async () => {
        const scheduledMatch = { ...mockMatch, status: MatchStatus.SCHEDULED };
        const updateDto: UpdateMatchScoreDto = { team: TeamIdentifier.A, score: 10 };

        mockPrismaService.match.findUnique.mockResolvedValueOnce(scheduledMatch);
        
        await expect(matchService.updateMatchScore(1, updateDto)).rejects.toThrow(new BadRequestException('Can only update score for matches in progress'));
    });
  });
});
