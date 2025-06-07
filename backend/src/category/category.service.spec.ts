import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

const mockCategory = {
  id: 1,
  name: 'Test name',
  description: 'Test description',
  scoreRules: 'Test score rules',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CategoryService', () => {
  let categoryService: CategoryService;

  const mockPrismaService = {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    categoryService = module.get<CategoryService>(CategoryService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  describe('create', () => {
    const createCategoryDto: CreateCategoryDto = {
      name: 'Test name',
      description: 'Test description',
      scoreRules: 'Test score rules',
    };

    it('should create a category', async () => {
      mockPrismaService.category.create.mockResolvedValueOnce(mockCategory);

      const result = await categoryService.create(createCategoryDto);

      expect(result).toEqual(mockCategory);
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: createCategoryDto,
        select: {
          id: true,
          name: true,
          description: true,
          scoreRules: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      mockPrismaService.category.findMany.mockResolvedValueOnce([mockCategory]);

      const result = await categoryService.findAll();

      expect(result).toEqual([mockCategory]);

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          description: true,
          scoreRules: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      mockPrismaService.category.findUnique.mockResolvedValueOnce(mockCategory);

      const result = await categoryService.findOne(1);

      expect(result).toEqual(mockCategory);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          description: true,
          scoreRules: true,
          createdAt: true,
          updatedAt: true,
          arenas: true,
          teams: true,
        },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(mockPrismaService.category, 'findUnique').mockResolvedValueOnce(null);
      await expect(categoryService.findOne(1)).rejects.toThrow(
        new NotFoundException(`Category with ID ${1} not found`),
      );
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateCategoryDto = { name: 'Test', description: 'Test desc', scoreRules: 'Rules' };

      mockPrismaService.category.findUnique.mockResolvedValueOnce(mockCategory);
      mockPrismaService.category.update.mockResolvedValueOnce(mockCategory);

      const result = await categoryService.update(1, updateCategoryDto);

      expect(result).toEqual(mockCategory);
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateCategoryDto,
        select: {
          id: true,
          name: true,
          description: true,
          scoreRules: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValueOnce(null);
      await expect(
        categoryService.update(1, { name: '', description: '', scoreRules: '' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      mockPrismaService.category.findUnique.mockResolvedValueOnce({
        arenas: [],
        teams: [],
      });
      mockPrismaService.category.delete.mockResolvedValueOnce(true);
      const result = await categoryService.remove(1);
      expect(result).toBe(true);
      expect(mockPrismaService.category.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValueOnce(null);
      await expect(categoryService.remove(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if has arenas', async () => {
      mockPrismaService.category.findUnique.mockResolvedValueOnce({
        arenas: [{}],
        teams: [],
      });
      await expect(categoryService.remove(1)).rejects.toThrow(
        new ForbiddenException(
          `Category with ID ${1} cannot be deleted because it has associated arenas.`,
        ),
      );
    });

    it('should throw ForbiddenException if has teams', async () => {
      mockPrismaService.category.findUnique.mockResolvedValueOnce({
        arenas: [],
        teams: [{}],
      });
      await expect(categoryService.remove(1)).rejects.toThrow(
        new ForbiddenException(
          `Category with ID ${1} cannot be deleted because it has associated teams.`,
        ),
      );
    });
  });
});
