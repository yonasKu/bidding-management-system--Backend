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
import { HealthModule } from './health/health.module';
import { ReportsModule } from './reports/reports.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    TendersModule,
    BidsModule,
    EvaluationsModule,
    AdminModule,
    HealthModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
