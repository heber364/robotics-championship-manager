import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';

describe('PrismaService', () => {
  let service: PrismaService;
  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'DATABASE_URL') return 'postgresql://user:pass@localhost:5432/db';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call $connect on module init', async () => {
    const connectSpy = jest.spyOn(service, '$connect').mockResolvedValueOnce(undefined);
    await service.onModuleInit();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should call $disconnect on module destroy', async () => {
    const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValueOnce(undefined);
    await service.onModuleDestroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('should not clean database in production', async () => {
    process.env.NODE_ENV = 'production';
    const userDeleteManySpy = jest.spyOn(service.user, 'deleteMany');
    await service.cleanDatabase();
    expect(userDeleteManySpy).not.toHaveBeenCalled();
    process.env.NODE_ENV = 'test';
  });

  it('should clean database when not in production', async () => {
    process.env.NODE_ENV = 'test';
    const userDeleteManySpy = jest
      .spyOn(service.user, 'deleteMany')
      .mockResolvedValueOnce({ count: 0 });
    await service.cleanDatabase();
    expect(userDeleteManySpy).toHaveBeenCalled();
  });
});
