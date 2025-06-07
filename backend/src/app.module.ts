import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AtGuard } from './common/guards';
import { EmailModule } from './email/email.module';
import { PrismaModule } from './prisma/prisma.module';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, EmailModule, PrismaModule],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: AtGuard,
    }
  ],
})
export class AppModule { }
