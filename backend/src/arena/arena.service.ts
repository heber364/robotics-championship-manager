import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArenaDto, UpdateArenaDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { ArenaEntity } from './entities/arena.entity';

@Injectable()
export class ArenaService {
  constructor(private prismaService: PrismaService) {}

  async create(createArenaDto: CreateArenaDto): Promise<ArenaEntity> {
    return await this.prismaService.arena.create({
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
  }

  async findAll(): Promise<ArenaEntity[]> {
    return await this.prismaService.arena.findMany({
      select: {
        id: true,
        name: true,
        youtubeLink: true,
        idCategory: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: number): Promise<ArenaEntity> {
    const arena = await this.prismaService.arena.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        youtubeLink: true,
        idCategory: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!arena) {
      throw new NotFoundException('Arena not found');
    }
    return arena;
  }

  async update(id: number, updateArenaDto: UpdateArenaDto): Promise<ArenaEntity> {
    const arena = await this.prismaService.arena.findUnique({
      where: { id },
    });

    if (!arena) {
      throw new NotFoundException('Arena not found');
    }

    return await this.prismaService.arena.update({
      where: { id },
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
  }

  async remove(id: number): Promise<boolean> {
    const arena = await this.prismaService.arena.findUnique({
      where: { id },
    });

    if (!arena) {
      throw new NotFoundException('Arena not found');
    }

    await this.prismaService.arena.delete({
      where: { id },
    });

    return true;
  }
}
