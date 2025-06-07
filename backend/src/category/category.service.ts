import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryEntity } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(private prismaService: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
    return await this.prismaService.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        scoreRules: createCategoryDto.scoreRules,
      },
      select: {
        id: true,
        name: true,
        description: true,
        scoreRules: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(): Promise<CategoryEntity[]> {
    return await this.prismaService.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        scoreRules: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: number) {
    const category = await this.prismaService.category.findUnique({
      where: { id },
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

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return this.prismaService.category.update({
      where: { id },
      data: {
        name: updateCategoryDto.name,
        description: updateCategoryDto.description,
        scoreRules: updateCategoryDto.scoreRules,
      },
      select: {
        id: true,
        name: true,
        description: true,
        scoreRules: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: number): Promise<boolean> {
    const category = await this.prismaService.category.findUnique({
      where: { id },
      select: {
        arenas: true,
        teams: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const hasArenaMatches = category.arenas.length > 0;
    const hasTeams = category.teams.length > 0;

    if (hasArenaMatches) {
      throw new ForbiddenException(
        `Category with ID ${id} cannot be deleted because it has associated arenas.`,
      );
    }
    if (hasTeams) {
      throw new ForbiddenException(
        `Category with ID ${id} cannot be deleted because it has associated teams.`,
      );
    }

    await this.prismaService.category.delete({
      where: { id },
    });

    return true;
  }
}
