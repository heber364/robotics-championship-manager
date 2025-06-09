/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';
import { Role } from '@prisma/client';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers: UserEntity[] = [
        {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          roles: [Role.USER],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const mockUser: UserEntity = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        roles: [Role.USER],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(1);

      expect(userService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });
});
