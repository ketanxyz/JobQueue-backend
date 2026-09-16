import { JobStatus } from './job-status.enum.js';

export interface Job {
  id: number;
  title: string;
  type: string;
  status: JobStatus;
  createdAt: string;
}