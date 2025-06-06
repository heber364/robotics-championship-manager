import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { createSwaggerConfig } from './swager.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = createSwaggerConfig()

  const documentFactory = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalPipes(new ValidationPipe({}));
  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
