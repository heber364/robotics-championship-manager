import { DocumentBuilder } from '@nestjs/swagger';

export function createSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Robotics Championship Management API')
    .setDescription('This is the API documentation for the Robotics Championship Management application.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token JWT de acesso' },
      'bearer',
    )
    .build();
}