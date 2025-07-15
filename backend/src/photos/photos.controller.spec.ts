import { Test, TestingModule } from '@nestjs/testing';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { PhotoEntity } from './entities';
import { CreatePhotoDto } from './dto';

const mockPhoto: PhotoEntity = {
  id: 1,
  idMatch: 1,
  caption: 'Test Photo',
  url: 'test-url',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PhotosController', () => {
  let controller: PhotosController;
  let service: PhotosService;

  const mockPhotosService = {
    create: jest.fn(),
    findAllByMatch: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhotosController],
      providers: [
        {
          provide: PhotosService,
          useValue: mockPhotosService,
        },
      ],
    }).compile();

    controller = module.get<PhotosController>(PhotosController);
    service = module.get<PhotosService>(PhotosService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with the correct parameters', async () => {
      const matchId = 1;
      const file = { buffer: Buffer.from('test') } as Express.Multer.File;
      const createPhotoDto: CreatePhotoDto = { caption: 'Test Photo' };
      mockPhotosService.create.mockResolvedValueOnce(mockPhoto);

      const result = await controller.create(matchId, file, createPhotoDto);

      expect(result).toEqual(mockPhoto);
      expect(service.create).toHaveBeenCalledWith(matchId, file, createPhotoDto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAllByMatch and return an array of photos', async () => {
      const matchId = 1;
      mockPhotosService.findAllByMatch.mockResolvedValueOnce([mockPhoto]);

      const result = await controller.findAll(matchId);

      expect(result).toEqual([mockPhoto]);
      expect(service.findAllByMatch).toHaveBeenCalledWith(matchId);
    });
  });

  describe('remove', () => {
    it('should call service.remove and return true', async () => {
      const photoId = 1;
      mockPhotosService.remove.mockResolvedValueOnce(true);

      const result = await controller.remove(photoId);

      expect(result).toBe(true);
      expect(service.remove).toHaveBeenCalledWith(photoId);
    });
  });
});
