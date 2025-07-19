import { Test, TestingModule } from '@nestjs/testing';
import { ArenaService } from './arena.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArenaDto } from './dto/create-arena.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateArenaDto } from './dto';

const mockArena = {
  id: 1,
  name: 'Test Arena',
  youtubeLink: 'https://youtube.com/watch?v=test',
  idCategory: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ArenaService', () => {
  let arenaService: ArenaService;

  const mockPrismaService = {
    arena: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArenaService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    arenaService = module.get<ArenaService>(ArenaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(arenaService).toBeDefined();
  });

  describe('create', () => {
    const createArenaDto: CreateArenaDto = {
      name: 'Test Arena',
      youtubeLink: 'https://youtube.com/watch?v=test',
      idCategory: 1,
    };

    it('should create an arena', async () => {
      mockPrismaService.arena.create.mockResolvedValueOnce(mockArena);

      const result = await arenaService.create(createArenaDto);

      expect(result).toEqual(mockArena);
      expect(mockPrismaService.arena.create).toHaveBeenCalledWith({
        data: {
          name: createArenaDto.name,
          youtubeLink: createArenaDto.youtubeLink,
          idCategory: createArenaDto.idCategory,
        },
        select: {
          id: true,
          name: true,
          youtubeLink: true,
          idCategory: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all arenas', async () => {
      mockPrismaService.arena.findMany.mockResolvedValueOnce([mockArena]);

      const result = await arenaService.findAll();

      expect(result).toEqual([mockArena]);
      expect(mockPrismaService.arena.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          youtubeLink: true,
          idCategory: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return an arena by id', async () => {
      mockPrismaService.arena.findUnique.mockResolvedValueOnce(mockArena);

      const result = await arenaService.findOne(1);

      expect(result).toEqual(mockArena);
      expect(mockPrismaService.arena.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          youtubeLink: true,
          idCategory: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.arena.findUnique.mockResolvedValueOnce(null);
      await expect(arenaService.findOne(1)).rejects.toThrow(
        new NotFoundException('Arena not found'),
      );
    });
  });

  describe('update', () => {
    it('should update an arena', async () => {
      const updateArenaDto: UpdateArenaDto = {
        name: mockArena.name,
        youtubeLink: mockArena.youtubeLink,
      };
      mockPrismaService.arena.findUnique.mockResolvedValueOnce(mockArena);
      mockPrismaService.arena.update.mockResolvedValueOnce(mockArena);

      const result = await arenaService.update(1, updateArenaDto);

      expect(result).toEqual(mockArena);
      expect(mockPrismaService.arena.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateArenaDto,
        select: {
          id: true,
          name: true,
          youtubeLink: true,
          idCategory: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.arena.findUnique.mockResolvedValueOnce(null);
      await expect(arenaService.update(1, { name: '', youtubeLink: '' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an arena', async () => {
      mockPrismaService.arena.findUnique.mockResolvedValueOnce(mockArena);
      mockPrismaService.arena.delete.mockResolvedValueOnce(true);

      const result = await arenaService.remove(1);

      expect(result).toBe(true);
      expect(mockPrismaService.arena.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.arena.findUnique.mockResolvedValueOnce(null);
      await expect(arenaService.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
