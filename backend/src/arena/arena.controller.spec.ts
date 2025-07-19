import { Test, TestingModule } from '@nestjs/testing';
import { ArenaController } from './arena.controller';
import { ArenaService } from './arena.service';
import { CreateArenaDto } from './dto/create-arena.dto';
import { UpdateArenaDto } from './dto/update-arena.dto';

const mockArena = {
  id: 1,
  name: 'Test Arena',
  youtubeLink: 'https://youtube.com/watch?v=test',
  idCategory: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ArenaController', () => {
  let arenaController: ArenaController;
  let arenaService: ArenaService;

  const mockArenaService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArenaController],
      providers: [{ provide: ArenaService, useValue: mockArenaService }],
    }).compile();

    arenaController = module.get<ArenaController>(ArenaController);
    arenaService = module.get<ArenaService>(ArenaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(arenaController).toBeDefined();
    expect(arenaService).toBeDefined();
  });

  describe('create', () => {
    const createArenaDto: CreateArenaDto = {
      name: 'Test Arena',
      youtubeLink: 'https://youtube.com/watch?v=test',
      idCategory: 1,
    };

    it('should create an arena', async () => {
      mockArenaService.create.mockResolvedValueOnce(mockArena);

      const result = await arenaController.create(createArenaDto);

      expect(result).toEqual(mockArena);
      expect(mockArenaService.create).toHaveBeenCalledWith(createArenaDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of arenas', async () => {
      mockArenaService.findAll.mockResolvedValueOnce([mockArena]);

      const result = await arenaController.findAll();

      expect(result).toEqual([mockArena]);
      expect(mockArenaService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an arena by id', async () => {
      mockArenaService.findOne.mockResolvedValueOnce(mockArena);

      const result = await arenaController.findOne(1);

      expect(result).toEqual(mockArena);
      expect(mockArenaService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    const updateArenaDto: UpdateArenaDto = {
      name: 'Updated Arena',
      youtubeLink: 'https://youtube.com/watch?v=updated',
    };

    it('should update an arena', async () => {
      mockArenaService.update.mockResolvedValueOnce({ ...mockArena, ...updateArenaDto });

      const result = await arenaController.update(1, updateArenaDto);

      expect(result).toEqual({ ...mockArena, ...updateArenaDto });
      expect(mockArenaService.update).toHaveBeenCalledWith(1, updateArenaDto);
    });
  });

  describe('remove', () => {
    it('should remove an arena', async () => {
      mockArenaService.remove.mockResolvedValueOnce(true);

      const result = await arenaController.remove(1);

      expect(result).toBe(true);
      expect(mockArenaService.remove).toHaveBeenCalledWith(1);
    });
  });
});
