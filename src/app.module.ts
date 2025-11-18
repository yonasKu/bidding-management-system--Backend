import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TendersModule } from './tenders/tenders.module';
import { BidsModule } from './bids/bids.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { AdminModule } from './admin/admin.module';
 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TendersModule,
    BidsModule,
    EvaluationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
