import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { PrismaClient } from '@prisma/client';
import { AppModule } from '../../../src/app.module';
import { configureApp } from '../../../src/app.setup';
import { PrismaService } from '../../../src/prisma/prisma.service';

type JsonBody = Record<string, unknown> | Array<unknown> | undefined;

export type ApiTestResponse<TBody = JsonBody> = {
  status: number;
  body: TBody;
};

export class ApiTestApp {
  readonly app: INestApplication;
  readonly prisma: PrismaClient;
  readonly baseUrl: string;

  private constructor(app: INestApplication, prisma: PrismaClient, baseUrl: string) {
    this.app = app;
    this.prisma = prisma;
    this.baseUrl = baseUrl;
  }

  static async create() {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });

    configureApp(app);
    await app.listen(0, '127.0.0.1');

    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to determine backend E2E server address');
    }

    return new ApiTestApp(
      app,
      app.get(PrismaService),
      `http://127.0.0.1:${address.port}`,
    );
  }

  async request<TBody = JsonBody>(
    path: string,
    init?: Omit<RequestInit, 'body'> & { body?: Record<string, unknown> },
  ): Promise<ApiTestResponse<TBody>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });

    const responseText = await response.text();
    const responseBody = responseText ? (JSON.parse(responseText) as TBody) : (undefined as TBody);

    return {
      status: response.status,
      body: responseBody,
    };
  }

  async close() {
    await this.app.close();
  }
}
