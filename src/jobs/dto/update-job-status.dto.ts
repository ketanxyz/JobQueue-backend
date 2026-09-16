import { IsEnum } from 'class-validator';
import { JobStatus } from '../job-status.enum.js';

export class UpdateJobStatusDto {
  @IsEnum(JobStatus)
  status!: JobStatus;
}