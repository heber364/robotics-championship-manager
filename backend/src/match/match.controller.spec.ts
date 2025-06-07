import { Test, TestingModule } from '@nestjs/testing';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchResult } from '@prisma/client';

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

describe('MatchController', () => {
  let matchController: MatchController;
  let matchService: MatchService;

  const mockMatchService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchController],
      providers: [{ provide: MatchService, useValue: mockMatchService }],
    }).compile();

    matchController = module.get<MatchController>(MatchController);
    matchService = module.get<MatchService>(MatchService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(matchController).toBeDefined();
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
      mockMatchService.create.mockResolvedValueOnce(mockMatch);

      const result = await matchController.create(createMatchDto);

      expect(result).toEqual(mockMatch);
      expect(mockMatchService.create).toHaveBeenCalledWith(createMatchDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of matches', async () => {
      mockMatchService.findAll.mockResolvedValueOnce([mockMatch]);

      const result = await matchController.findAll();

      expect(result).toEqual([mockMatch]);
      expect(mockMatchService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a match by id', async () => {
      mockMatchService.findOne.mockResolvedValueOnce(mockMatch);

      const result = await matchController.findOne(1);

      expect(result).toEqual(mockMatch);
      expect(mockMatchService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    const updateMatchDto: UpdateMatchDto = {
      status: 'IN_PROGRESS',
      matchResult: MatchResult.TEAM_B,
    };

    it('should update a match', async () => {
      mockMatchService.update.mockResolvedValueOnce({ ...mockMatch, ...updateMatchDto });

      const result = await matchController.update(1, updateMatchDto);

      expect(result).toEqual({ ...mockMatch, ...updateMatchDto });
      expect(mockMatchService.update).toHaveBeenCalledWith(1, updateMatchDto);
    });
  });

  describe('remove', () => {
    it('should remove a match', async () => {
      mockMatchService.remove.mockResolvedValueOnce(true);

      const result = await matchController.remove(1);

      expect(result).toBe(true);
      expect(mockMatchService.remove).toHaveBeenCalledWith(1);
    });
  });
});
