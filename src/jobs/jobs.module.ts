import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller.js';
import { JobsRepository } from './jobs.repository.js';
import { JobsService } from './jobs.service.js';

@Module({
  controllers: [JobsController],
  providers: [JobsRepository, JobsService],
})
export class JobsModule {}