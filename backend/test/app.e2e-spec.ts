import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from '../src/auth/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    describe('Signup', () => {
      const dto: AuthDto = {
        email: 'test@gmail.com',
        password: 'super-secret-password',
      };

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
          .stores('access_token', 'access_token')
          .stores('refresh_token', 'refresh_token');
      });
    });

    describe('Signin', () => {
      const dto: AuthDto = {
        email: 'test@gmail.com',
        password: 'super-secret-password',
      };

      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('access_token', 'access_token')
          .stores('refresh_token', 'refresh_token');
      });
    });

    describe('Refresh', () => {
      it('should refresh tokens', async () => {
        // wait for 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return pactum
          .spec()
          .post('/auth/refresh')
          .withBearerToken('$S{refresh_token}')
          .expectStatus(200)
          .expect((ctx) => {
            const body = ctx.res.body;
            expect(body.refresh_token).not.toBe('$S{access_token}');
            expect(body.refresh_token).not.toBe('$S{refresh_token}');
          })
          .stores('access_token', 'access_token')
          .stores('refresh_token', 'refresh_token');
      });
    });

    describe('Logout', () => {
      it('should logout', () => {
        return pactum
          .spec()
          .post('/auth/logout')
          .withBearerToken('$S{access_token}')
          .expectStatus(200);
      });
    });
  });
});