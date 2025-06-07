import { Test, TestingModule } from '@nestjs/testing';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

const mockTeam = {
  id: 1,
  name: 'Test Team',
  robotName: 'Test Robot',
  idCategory: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TeamController', () => {
  let teamController: TeamController;
  let teamService: TeamService;

  const mockTeamService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamController],
      providers: [{ provide: TeamService, useValue: mockTeamService }],
    }).compile();

    teamController = module.get<TeamController>(TeamController);
    teamService = module.get<TeamService>(TeamService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(teamController).toBeDefined();
    expect(teamService).toBeDefined();
  });

  describe('create', () => {
    const createTeamDto: CreateTeamDto = {
      name: 'Test Team',
      robotName: 'Test Robot',
      idCategory: 1,
    };

    it('should create a team', async () => {
      mockTeamService.create.mockResolvedValueOnce(mockTeam);

      const result = await teamController.create(createTeamDto);

      expect(result).toEqual(mockTeam);
      expect(mockTeamService.create).toHaveBeenCalledWith(createTeamDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of teams', async () => {
      mockTeamService.findAll.mockResolvedValueOnce([mockTeam]);

      const result = await teamController.findAll();

      expect(result).toEqual([mockTeam]);
      expect(mockTeamService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a team by id', async () => {
      mockTeamService.findOne.mockResolvedValueOnce(mockTeam);

      const result = await teamController.findOne(1);

      expect(result).toEqual(mockTeam);
      expect(mockTeamService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    const updateTeamDto: UpdateTeamDto = {
      name: 'Updated Team',
      robotName: 'Updated Robot',
    };

    it('should update a team', async () => {
      mockTeamService.update.mockResolvedValueOnce({ ...mockTeam, ...updateTeamDto });

      const result = await teamController.update(1, updateTeamDto);

      expect(result).toEqual({ ...mockTeam, ...updateTeamDto });
      expect(mockTeamService.update).toHaveBeenCalledWith(1, updateTeamDto);
    });
  });

  describe('remove', () => {
    it('should remove a team', async () => {
      mockTeamService.remove.mockResolvedValueOnce(true);

      const result = await teamController.remove(1);

      expect(result).toBe(true);
      expect(mockTeamService.remove).toHaveBeenCalledWith(1);
    });
  });
});
