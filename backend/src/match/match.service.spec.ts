import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from './match.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { Prisma } from '@prisma/client';
import { MatchResult, MatchStatus } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateMatchDto } from './dto';

const mockMatch = {
  id: 1,
  idTeamA: 1,
  idTeamB: 2,
  idArena: 1,
  date: new Date(),
  status: 'SCHEDULED',
  observation: 'Test observation',
  matchResult: MatchResult.TEAM_A,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('MatchService', () => {
  let matchService: MatchService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    match: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    matchService = module.get<MatchService>(MatchService);
    prismaService = module.get<PrismaService>(PrismaService);

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
      date: new Date(),
      observation: 'Test observation',
    };

    it('should create a match', async () => {
      mockPrismaService.match.create.mockResolvedValueOnce(mockMatch);

      const result = await matchService.create(createMatchDto);

      expect(result).toEqual(mockMatch);
      expect(mockPrismaService.match.create).toHaveBeenCalledWith({
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
    });

    it('should throw PrismaClientKnownRequestError when foreign key constraint fails', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });

      mockPrismaService.match.create.mockRejectedValueOnce(error);

      await expect(matchService.create(createMatchDto)).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
    });
  });

  describe('findAll', () => {
    it('should return all matches', async () => {
      mockPrismaService.match.findMany.mockResolvedValueOnce([mockMatch]);

      const result = await matchService.findAll();

      expect(result).toEqual([mockMatch]);
      expect(mockPrismaService.match.findMany).toHaveBeenCalledWith({
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
    });
  });

  describe('findOne', () => {
    it('should return a match by id', async () => {
      mockPrismaService.match.findUnique.mockResolvedValueOnce(mockMatch);

      const result = await matchService.findOne(1);

      expect(result).toEqual(mockMatch);
      expect(mockPrismaService.match.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
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
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.match.findUnique.mockResolvedValueOnce(null);

      await expect(matchService.findOne(1)).rejects.toThrow(
        new NotFoundException('Match not found'),
      );
    });
  });

  describe('update', () => {
    it('should update a match', async () => {
      const updateMatchDto: UpdateMatchDto = {
        observation: 'teste',
        date: new Date(),
      };

      mockPrismaService.match.findUnique.mockResolvedValueOnce(mockMatch);
      const updatedMatch = { ...mockMatch, ...updateMatchDto };
      mockPrismaService.match.update.mockResolvedValueOnce(updatedMatch);

      const result = await matchService.update(1, updateMatchDto);

      expect(result).toEqual(updatedMatch);
      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: 1 },
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
    });

    it('should throw NotFoundException if match not found', async () => {
      const updateMatchDto: UpdateMatchDto = {
        observation: 'teste',
        date: new Date(),
      };
      mockPrismaService.match.findUnique.mockResolvedValueOnce(null);

      await expect(matchService.update(1, updateMatchDto)).rejects.toThrow(
        new NotFoundException('Match not found'),
      );
    });

    it('should throw PrismaClientKnownRequestError when foreign key constraint fails', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });

      mockPrismaService.match.findUnique.mockResolvedValueOnce(mockMatch);
      mockPrismaService.match.update.mockRejectedValueOnce(error);

      await expect(matchService.update(1, { idTeamA: 999 })).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
    });
  });

  describe('remove', () => {
    it('should delete a match', async () => {
      mockPrismaService.match.findUnique.mockResolvedValueOnce(mockMatch);
      mockPrismaService.match.delete.mockResolvedValueOnce(true);

      const result = await matchService.remove(1);

      expect(result).toBe(true);
      expect(mockPrismaService.match.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if match not found', async () => {
      mockPrismaService.match.findUnique.mockResolvedValueOnce(null);

      await expect(matchService.remove(1)).rejects.toThrow(
        new NotFoundException('Match not found'),
      );
    });
  });

  describe('startMatch', () => {
    it('should start a scheduled match', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.SCHEDULED,
      };

      const expectedResult = {
        ...mockMatch,
        status: MatchStatus.IN_PROGRESS,
        startTime: expect.any(Date),
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.match.update.mockResolvedValue(expectedResult);

      const result = await matchService.startMatch(1);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: MatchStatus.IN_PROGRESS,
          startTime: expect.any(Date),
        },
        select: {
          id: true,
          idTeamA: true,
          idTeamB: true,
          idArena: true,
          date: true,
          status: true,
          matchResult: true,
          observation: true,
          createdAt: true,
          updatedAt: true,
          startTime: true,
          endTime: true
        },
      });
    });

    it('should throw NotFoundException when match not found', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(matchService.startMatch(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when match is not scheduled', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.IN_PROGRESS,
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);

      await expect(matchService.startMatch(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('pauseMatch', () => {
    it('should pause a match in progress', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.IN_PROGRESS,
      };

      const expectedResult = {
        ...mockMatch,
        status: MatchStatus.SCHEDULED,
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.match.update.mockResolvedValue(expectedResult);

      const result = await matchService.pauseMatch(1);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: 1 },
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
          matchResult: true,
          observation: true,
          createdAt: true,
          updatedAt: true,
          startTime: true,
          endTime: true
        },
      });
    });

    it('should throw NotFoundException when match not found', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(matchService.pauseMatch(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when match is not in progress', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.SCHEDULED,
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);

      await expect(matchService.pauseMatch(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('endMatch', () => {
    it('should end a match in progress', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.IN_PROGRESS,
      };

      const expectedResult = {
        ...mockMatch,
        status: MatchStatus.FINISHED,
        endTime: expect.any(Date),
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.match.update.mockResolvedValue(expectedResult);

      const result = await matchService.endMatch(1);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: MatchStatus.FINISHED,
          endTime: expect.any(Date),
        },
        select: {
          id: true,
          idTeamA: true,
          idTeamB: true,
          idArena: true,
          date: true,
          status: true,
          matchResult: true,
          observation: true,
          createdAt: true,
          updatedAt: true,
          startTime: true,
          endTime: true
        },
      });
    });

    it('should throw NotFoundException when match not found', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(matchService.endMatch(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when match is already finished', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.FINISHED,
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);

      await expect(matchService.endMatch(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when match is cancelled', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.CANCELLED,
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);

      await expect(matchService.endMatch(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateMatchResult', () => {
    it('should update result for a match in progress', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.IN_PROGRESS,
      };

      const updateDto = {
        result: MatchResult.TEAM_A,
      };

      const expectedResult = {
        ...mockMatch,
        matchResult: MatchResult.TEAM_A,
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.match.update.mockResolvedValue(expectedResult);

      const result = await matchService.updateMatchResult(1, updateDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          matchResult: MatchResult.TEAM_A,
        },
        select: {
          id: true,
          idTeamA: true,
          idTeamB: true,
          idArena: true,
          date: true,
          status: true,
          matchResult: true,
          observation: true,
          createdAt: true,
          updatedAt: true,
          startTime: true,
          endTime: true
        },
      });
    });

    it('should throw NotFoundException when match not found', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(
        matchService.updateMatchResult(1, { result: MatchResult.TEAM_A }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when match is not in progress', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.SCHEDULED,
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);

      await expect(
        matchService.updateMatchResult(1, { result: MatchResult.TEAM_A }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
