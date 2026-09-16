import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto.js';
import { JobStatus } from './job-status.enum.js';
import { JobsRepository } from './jobs.repository.js';

@Injectable()
export class JobsService {
  constructor(private readonly jobsRepository: JobsRepository) {}

  create(createJobDto: CreateJobDto) {
    return this.jobsRepository.create(createJobDto);
  }

  findAll() {
    return this.jobsRepository.findAll();
  }

  updateStatus(id: number, status: JobStatus) {
    const job = this.jobsRepository.findById(id);
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    if ((job.status === JobStatus.Completed || job.status === JobStatus.Failed) && status === JobStatus.Running) {
      throw new ConflictException('A completed or failed job cannot become running again');
    }

    return this.jobsRepository.updateStatus(id, status);
  }

  remove(id: number) {
    if (!this.jobsRepository.delete(id)) {
      throw new NotFoundException(`Job ${id} not found`);
    }
  }
}