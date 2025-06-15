import { Test, TestingModule } from '@nestjs/testing';
import { TeamService } from './team.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateTeamDto } from './dto';

const mockTeam = {
  id: 1,
  name: 'Test Team',
  robotName: 'Test Robot',
  idCategory: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TeamService', () => {
  let teamService: TeamService;

  const mockPrismaService = {
    team: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    teamService = module.get<TeamService>(TeamService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(teamService).toBeDefined();
  });

  describe('create', () => {
    it('should create a team', async () => {
      const createTeamDto: CreateTeamDto = {
        name: mockTeam.name,
        robotName: mockTeam.robotName,
        idCategory: mockTeam.idCategory,
      };
      mockPrismaService.team.create.mockResolvedValueOnce(mockTeam);

      const result = await teamService.create(createTeamDto);

      expect(result).toEqual(mockTeam);
      expect(mockPrismaService.team.create).toHaveBeenCalledWith({
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
    });
  });

  describe('findAll', () => {
    it('should return all teams', async () => {
      mockPrismaService.team.findMany.mockResolvedValueOnce([mockTeam]);

      const result = await teamService.findAll();

      expect(result).toEqual([mockTeam]);
      expect(mockPrismaService.team.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          robotName: true,
          idCategory: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a team by id', async () => {
      mockPrismaService.team.findUnique.mockResolvedValueOnce(mockTeam);

      const result = await teamService.findOne(1);

      expect(result).toEqual(mockTeam);
      expect(mockPrismaService.team.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          robotName: true,
          idCategory: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.team.findUnique.mockResolvedValueOnce(null);
      await expect(teamService.findOne(1)).rejects.toThrow(new NotFoundException('Team not found'));
    });
  });

  describe('update', () => {
    it('should update a team', async () => {
      const updateTeamDto: UpdateTeamDto = { name: mockTeam.name, robotName: mockTeam.robotName };

      mockPrismaService.team.findUnique.mockResolvedValueOnce(mockTeam);
      mockPrismaService.team.update.mockResolvedValueOnce(mockTeam);

      const result = await teamService.update(1, updateTeamDto);

      expect(result).toEqual(mockTeam);
      expect(mockPrismaService.team.update).toHaveBeenCalledWith({
        where: { id: 1 },
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
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.team.findUnique.mockResolvedValueOnce(null);
      await expect(teamService.update(1, { name: '', robotName: '' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a team', async () => {
      mockPrismaService.team.findUnique.mockResolvedValueOnce(mockTeam);
      mockPrismaService.team.delete.mockResolvedValueOnce(true);

      const result = await teamService.remove(1);

      expect(result).toBe(true);
      expect(mockPrismaService.team.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.team.findUnique.mockResolvedValueOnce(null);
      await expect(teamService.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
