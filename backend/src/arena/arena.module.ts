import { Module } from '@nestjs/common';
import { ArenaService } from './arena.service';
import { ArenaController } from './arena.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArenaController],
  providers: [ArenaService],
})
export class ArenaModule {}
