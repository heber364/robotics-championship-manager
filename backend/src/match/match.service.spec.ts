import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from './match.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { Prisma } from '@prisma/client';
import { MatchResult } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

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
      providers: [MatchService, { provide: PrismaService, useValue: mockPrismaService }],
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
      date: new Date(),
      status: 'SCHEDULED',
      observation: 'Test observation',
      matchResult: MatchResult.TEAM_A,
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
      const updateMatchDto = {
        status: 'IN_PROGRESS',
        matchResult: MatchResult.TEAM_B,
      };

      mockPrismaService.match.findUnique.mockResolvedValueOnce(mockMatch);
      mockPrismaService.match.update.mockResolvedValueOnce({ ...mockMatch, ...updateMatchDto });

      const result = await matchService.update(1, updateMatchDto);

      expect(result).toEqual({ ...mockMatch, ...updateMatchDto });
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
          observation: true,
          matchResult: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException if match not found', async () => {
      mockPrismaService.match.findUnique.mockResolvedValueOnce(null);

      await expect(matchService.update(1, { status: '' })).rejects.toThrow(
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
});
