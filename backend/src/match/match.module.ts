import { Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchGateway } from './match.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [MatchController],
  providers: [MatchService, MatchGateway],
  exports: [MatchService],
})
export class MatchModule {}
