import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AtGuard } from './common/guards';
import { EmailModule } from './email/email.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoryModule } from './category/category.module';
import { TeamModule } from './team/team.module';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, EmailModule, PrismaModule, CategoryModule, TeamModule],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: AtGuard,
    }
  ],
})
export class AppModule { }
