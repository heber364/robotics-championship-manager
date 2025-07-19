import { Test, TestingModule } from '@nestjs/testing';
import { PhotosService } from './photos.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PhotoEntity } from './entities';

const mockPhoto: PhotoEntity = {
  id: 1,
  idMatch: 1,
  caption: 'Test Photo',
  url: 'test-url',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PhotosService', () => {
  let service: PhotosService;
  let prisma: PrismaService;
  let storageService: StorageService;

  const mockPrismaService = {
    photo: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockStorageService = {
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotosService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<PhotosService>(PhotosService);
    prisma = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should upload a file and create a photo record', async () => {
      const matchId = 1;
      const file = { buffer: Buffer.from('test') } as Express.Multer.File;
      const createPhotoDto = { caption: 'Test Photo' };
      const uploadResult = { path: 'test-path' };

      mockStorageService.upload.mockResolvedValue(uploadResult);
      mockPrismaService.photo.create.mockResolvedValue(mockPhoto);

      const result = await service.create(matchId, file, createPhotoDto);

      expect(storageService.upload).toHaveBeenCalled();
      expect(prisma.photo.create).toHaveBeenCalledWith({
        data: {
          url: uploadResult.path,
          caption: createPhotoDto.caption,
          idMatch: matchId,
        },
      });
      expect(result).toEqual(mockPhoto);
    });
  });

  describe('findAllByMatch', () => {
    it('should return an array of photos for a match', async () => {
      const matchId = 1;
      mockPrismaService.photo.findMany.mockResolvedValue([mockPhoto]);
      mockStorageService.getPublicUrl.mockReturnValue('public-test-url');

      const result = await service.findAllByMatch(matchId);

      expect(prisma.photo.findMany).toHaveBeenCalledWith({ where: { idMatch: matchId } });
      expect(storageService.getPublicUrl).toHaveBeenCalled();
      expect(result[0].url).toBe('public-test-url');
    });
  });

  describe('remove', () => {
    it('should find a photo, remove it from storage, and delete the record', async () => {
      const photoId = 1;
      mockPrismaService.photo.findUnique.mockResolvedValue(mockPhoto);

      const result = await service.remove(photoId);

      expect(prisma.photo.findUnique).toHaveBeenCalledWith({ where: { id: photoId } });
      expect(storageService.remove).toHaveBeenCalled();
      expect(prisma.photo.delete).toHaveBeenCalledWith({ where: { id: photoId } });
      expect(result).toBe(true);
    });

    it('should throw an error if the photo does not exist', async () => {
      const photoId = 1;
      mockPrismaService.photo.findUnique.mockResolvedValue(null);

      await expect(service.remove(photoId)).rejects.toThrow('Photo not found');
    });
  });
});
