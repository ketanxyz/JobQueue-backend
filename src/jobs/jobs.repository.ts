import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { CreateJobDto } from './dto/create-job.dto.js';
import { JobStatus } from './job-status.enum.js';
import { Job } from './job.entity.js';

@Injectable()
export class JobsRepository implements OnModuleDestroy {
  private readonly database: Database.Database;

  constructor() {
    const databasePath = process.env.JOBS_DB_PATH ?? join(process.cwd(), 'data', 'jobs.sqlite');
    if (databasePath !== ':memory:') {
      mkdirSync(dirname(databasePath), { recursive: true });
    }

    this.database = new Database(databasePath);
    this.database.pragma('journal_mode = WAL');
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
        created_at TEXT NOT NULL
      )
    `);
  }

  create(job: CreateJobDto): Job {
    const createdAt = new Date().toISOString();
    const result = this.database
      .prepare('INSERT INTO jobs (title, type, status, created_at) VALUES (?, ?, ?, ?)')
      .run(job.title, job.type, JobStatus.Pending, createdAt);

    return this.findById(Number(result.lastInsertRowid))!;
  }

  findAll(): Job[] {
    return this.database
      .prepare('SELECT id, title, type, status, created_at AS createdAt FROM jobs ORDER BY id DESC')
      .all() as Job[];
  }

  findById(id: number): Job | undefined {
    return this.database
      .prepare('SELECT id, title, type, status, created_at AS createdAt FROM jobs WHERE id = ?')
      .get(id) as Job | undefined;
  }

  updateStatus(id: number, status: JobStatus): Job | undefined {
    this.database.prepare('UPDATE jobs SET status = ? WHERE id = ?').run(status, id);
    return this.findById(id);
  }

  delete(id: number): boolean {
    return this.database.prepare('DELETE FROM jobs WHERE id = ?').run(id).changes > 0;
  }

  onModuleDestroy(): void {
    this.database.close();
  }
}