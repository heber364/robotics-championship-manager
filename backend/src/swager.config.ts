import { DocumentBuilder } from '@nestjs/swagger';

export function createSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Robotics Championship Management API')
    .setDescription('This is the API documentation for the Robotics Championship Management application.')
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', name: 'userId', in: 'header', description: 'ID do usuário autenticado' },
      'userId',
    )
    .addApiKey(
      { type: 'apiKey', name: 'refreshToken', in: 'header', description: 'Token de refresh do usuário' },
      'refreshToken',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token JWT de acesso' },
      'Authorization',
    )
    .build();
}