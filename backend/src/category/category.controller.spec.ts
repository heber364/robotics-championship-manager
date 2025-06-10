/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './entities/category.entity';

describe('CategoryController', () => {
  let categoryController: CategoryController;
  let categoryService: CategoryService;

  const mockCategoryService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [{ provide: CategoryService, useValue: mockCategoryService }],
    }).compile();

    categoryController = module.get<CategoryController>(CategoryController);
    categoryService = module.get<CategoryService>(CategoryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(categoryController).toBeDefined();
    expect(categoryService).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'Test Category',
        description: 'Test Description',
        scoreRules: 'Test Rules',
      };

      const mockCategory: CategoryEntity = {
        id: 1,
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        scoreRules: createCategoryDto.scoreRules,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoryService.create.mockResolvedValue(mockCategory);

      const result = await categoryController.create(createCategoryDto);

      expect(categoryService.create).toHaveBeenCalledWith(createCategoryDto);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      const mockCategories: CategoryEntity[] = [
        {
          id: 1,
          name: 'Test Category',
          description: 'Test Description',
          scoreRules: 'Test Rules',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCategoryService.findAll.mockResolvedValue(mockCategories);

      const result = await categoryController.findAll();

      expect(categoryService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });
  });

  describe('findOne', () => {
    it('should return a single category', async () => {
      const mockCategory: CategoryEntity = {
        id: 1,
        name: 'Test Category',
        description: 'Test Description',
        scoreRules: 'Test Rules',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoryService.findOne.mockResolvedValue(mockCategory);

      const result = await categoryController.findOne(1);

      expect(categoryService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        name: 'Updated Category',
        description: 'Updated Description',
        scoreRules: 'Updated Rules',
      };

      const mockCategory: CategoryEntity = {
        id: 1,
        name: updateCategoryDto.name!,
        description: updateCategoryDto.description!,
        scoreRules: updateCategoryDto.scoreRules!,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoryService.update.mockResolvedValue(mockCategory);

      const result = await categoryController.update(1, updateCategoryDto);

      expect(categoryService.update).toHaveBeenCalledWith(1, updateCategoryDto);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      mockCategoryService.remove.mockResolvedValue(true);

      const result = await categoryController.remove(1);

      expect(categoryService.remove).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });
});
