import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

describe('Jobs API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.JOBS_DB_PATH = ':memory:';
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    const { ValidationPipe } = await import('@nestjs/common');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.JOBS_DB_PATH;
  });

  it('creates a pending job and prevents terminal jobs from running again', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/jobs')
      .send({ title: 'Export report', type: 'report' })
      .expect(201);

    expect(createResponse.body.status).toBe('pending');
    expect(createResponse.body.createdAt).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .patch(`/jobs/${createResponse.body.id}/status`)
      .send({ status: 'completed' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/jobs/${createResponse.body.id}/status`)
      .send({ status: 'running' })
      .expect(409);
  });

  it('rejects invalid input and reports missing jobs', async () => {
    await request(app.getHttpServer()).post('/jobs').send({ title: '', type: 'report' }).expect(400);
    await request(app.getHttpServer()).patch('/jobs/999/status').send({ status: 'running' }).expect(404);
    await request(app.getHttpServer()).delete('/jobs/999').expect(404);
  });
});