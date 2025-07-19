import { Test, TestingModule } from '@nestjs/testing';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { CreateMatchDto, UpdateMatchDto, UpdateMatchScoreDto } from './dto';
import { MatchEntity } from './entities/match.entity';
import { MatchStatus } from './enums/match-status.enum';
import { TeamIdentifier } from './dto/update-match-score.dto';

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

describe('MatchController', () => {
  let controller: MatchController;
  let service: MatchService;

  const mockMatchService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    startMatch: jest.fn(),
    pauseMatch: jest.fn(),
    endMatch: jest.fn(),
    updateMatchScore: jest.fn(),
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
    service = module.get<MatchService>(MatchService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with the correct dto', async () => {
      const createMatchDto: CreateMatchDto = {
        idTeamA: 1,
        idTeamB: 2,
        idArena: 1,
        idJudge: 1,
        date: new Date(),
        observation: 'Test observation',
      };
      mockMatchService.create.mockResolvedValueOnce(mockMatch);

      const result = await controller.create(createMatchDto);

      expect(result).toEqual(mockMatch);
      expect(service.create).toHaveBeenCalledWith(createMatchDto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll and return an array of matches', async () => {
      mockMatchService.findAll.mockResolvedValueOnce([mockMatch]);

      const result = await controller.findAll();

      expect(result).toEqual([mockMatch]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return a match', async () => {
      mockMatchService.findOne.mockResolvedValueOnce(mockMatch);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockMatch);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should call service.update with correct parameters', async () => {
      const updateMatchDto: UpdateMatchDto = { observation: 'Updated observation' };
      const updatedMatch = { ...mockMatch, ...updateMatchDto };
      mockMatchService.update.mockResolvedValueOnce(updatedMatch);

      const result = await controller.update(1, updateMatchDto);

      expect(result).toEqual(updatedMatch);
      expect(service.update).toHaveBeenCalledWith(1, updateMatchDto);
    });
  });

  describe('remove', () => {
    it('should call service.remove and return true', async () => {
      mockMatchService.remove.mockResolvedValueOnce(true);

      const result = await controller.remove(1);

      expect(result).toBe(true);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('startMatch', () => {
    it('should call service.startMatch with correct parameters', async () => {
      const judgeId = 1;
      const startedMatch = { ...mockMatch, status: MatchStatus.IN_PROGRESS };
      mockMatchService.startMatch.mockResolvedValueOnce(startedMatch);

      await controller.startMatch(1, judgeId);

      expect(service.startMatch).toHaveBeenCalledWith(1, judgeId);
    });
  });

  describe('pauseMatch', () => {
    it('should call service.pauseMatch with correct parameters', async () => {
      const judgeId = 1;
      const pausedMatch = { ...mockMatch, status: MatchStatus.SCHEDULED };
      mockMatchService.pauseMatch.mockResolvedValueOnce(pausedMatch);

      await controller.pauseMatch(1, judgeId);

      expect(service.pauseMatch).toHaveBeenCalledWith(1, judgeId);
    });
  });

  describe('endMatch', () => {
    it('should call service.endMatch with correct parameters', async () => {
      const judgeId = 1;
      const finishedMatch = { ...mockMatch, status: MatchStatus.FINISHED };
      mockMatchService.endMatch.mockResolvedValueOnce(finishedMatch);

      await controller.endMatch(1, judgeId);

      expect(service.endMatch).toHaveBeenCalledWith(1, judgeId);
    });
  });

  describe('updateMatchScore', () => {
    it('should call service.updateMatchScore with correct parameters', async () => {
      const judgeId = 1;
      const updateScoreDto: UpdateMatchScoreDto = { team: TeamIdentifier.A, score: 15 };
      const updatedMatch = { ...mockMatch, teamAScore: 15 };
      mockMatchService.updateMatchScore.mockResolvedValueOnce(updatedMatch);

      const result = await controller.updateMatchScore(1, updateScoreDto, judgeId);

      expect(result).toEqual(updatedMatch);
      expect(service.updateMatchScore).toHaveBeenCalledWith(1, updateScoreDto, judgeId);
    });
  });
});