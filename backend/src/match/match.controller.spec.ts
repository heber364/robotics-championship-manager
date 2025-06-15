import { Test, TestingModule } from '@nestjs/testing';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchResult, MatchStatus } from '@prisma/client';

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
  let controller: MatchController;

  const mockMatchService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    startMatch: jest.fn(),
    pauseMatch: jest.fn(),
    endMatch: jest.fn(),
    updateMatchResult: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchController],
      providers: [
        {
          provide: MatchService,
          useValue: mockMatchService,
        },
      ],
    }).compile();

    controller = module.get<MatchController>(MatchController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
      mockMatchService.create.mockResolvedValueOnce(mockMatch);

      const result = await controller.create(createMatchDto);

      expect(result).toEqual(mockMatch);
      expect(mockMatchService.create).toHaveBeenCalledWith(createMatchDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of matches', async () => {
      mockMatchService.findAll.mockResolvedValueOnce([mockMatch]);

      const result = await controller.findAll();

      expect(result).toEqual([mockMatch]);
      expect(mockMatchService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a match by id', async () => {
      mockMatchService.findOne.mockResolvedValueOnce(mockMatch);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockMatch);
      expect(mockMatchService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    const updateMatchDto: UpdateMatchDto = {
      observation: 'observaton',
    };

    it('should update a match', async () => {
      mockMatchService.update.mockResolvedValueOnce({ ...mockMatch, ...updateMatchDto });

      const result = await controller.update(1, updateMatchDto);

      expect(result).toEqual({ ...mockMatch, ...updateMatchDto });
      expect(mockMatchService.update).toHaveBeenCalledWith(1, updateMatchDto);
    });
  });

  describe('remove', () => {
    it('should remove a match', async () => {
      mockMatchService.remove.mockResolvedValueOnce(true);

      const result = await controller.remove(1);

      expect(result).toBe(true);
      expect(mockMatchService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('startMatch', () => {
    it('should start a match', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.IN_PROGRESS,
        startTime: new Date(),
      };

      mockMatchService.startMatch.mockResolvedValue(mockMatch);

      const result = await controller.startMatch(1);

      expect(result).toEqual(mockMatch);
      expect(mockMatchService.startMatch).toHaveBeenCalledWith(1);
    });
  });

  describe('pauseMatch', () => {
    it('should pause a match', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.SCHEDULED,
      };

      mockMatchService.pauseMatch.mockResolvedValue(mockMatch);

      const result = await controller.pauseMatch(1);

      expect(result).toEqual(mockMatch);
      expect(mockMatchService.pauseMatch).toHaveBeenCalledWith(1);
    });
  });

  describe('endMatch', () => {
    it('should end a match', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.FINISHED,
        endTime: new Date(),
      };

      mockMatchService.endMatch.mockResolvedValue(mockMatch);

      const result = await controller.endMatch(1);

      expect(result).toEqual(mockMatch);
      expect(mockMatchService.endMatch).toHaveBeenCalledWith(1);
    });
  });

  describe('updateMatchResult', () => {
    it('should update match result', async () => {
      const mockMatch = {
        id: 1,
        status: MatchStatus.IN_PROGRESS,
        matchResult: MatchResult.TEAM_A,
      };

      const updateDto = {
        result: MatchResult.TEAM_A,
      };

      mockMatchService.updateMatchResult.mockResolvedValue(mockMatch);

      const result = await controller.updateMatchResult(1, updateDto);

      expect(result).toEqual(mockMatch);
      expect(mockMatchService.updateMatchResult).toHaveBeenCalledWith(1, updateDto);
    });
  });
});
