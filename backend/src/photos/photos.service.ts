import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePhotoDto } from './dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async create(
    matchId: number,
    file: Express.Multer.File,
    dto: CreatePhotoDto,
  ) {
    const uploadResult = await this.storageService.upload(file, 'match-photos');

    return this.prisma.photo.create({
      data: {
        url: uploadResult.path,
        caption: dto.caption,
        idMatch: matchId,
      },
    });
  }

  async findAllByMatch(matchId: number) {
    const photos = await this.prisma.photo.findMany({
      where: { idMatch: matchId },
    });

    return photos.map((photo) => ({
      ...photo,
      url: this.storageService.getPublicUrl(photo.url, 'match-photos'),
    }));
  }

  async remove(photoId: number) {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new Error('Photo not found');
    }

    await this.storageService.remove(photo.url, 'match-photos');

    return this.prisma.photo.delete({
      where: { id: photoId },
    });
  }
}
