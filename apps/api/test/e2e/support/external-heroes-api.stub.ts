import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export class ExternalHeroesApiStub {
  private server?: Server;
  private payload: JsonValue = [];
  private statusCode = 200;
  private responseDelayMilliseconds = 0;
  private requestCount = 0;

  async start() {
    this.server = createServer(
      (_request: IncomingMessage, response: ServerResponse) => {
        this.requestCount += 1;

        const writeResponse = () => {
          response.statusCode = this.statusCode;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify(this.payload));
        };

        if (this.responseDelayMilliseconds > 0) {
          setTimeout(writeResponse, this.responseDelayMilliseconds);
          return;
        }

        writeResponse();
      },
    );

    await new Promise<void>((resolve, reject) => {
      this.server?.once('error', reject);
      this.server?.listen(0, '127.0.0.1', () => resolve());
    });
  }

  setSuccessResponse(payload: JsonValue) {
    this.payload = payload;
    this.statusCode = 200;
  }

  setFailureResponse(statusCode: number, payload: JsonValue = { message: 'stub error' }) {
    this.payload = payload;
    this.statusCode = statusCode;
  }

  setResponseDelay(milliseconds: number) {
    this.responseDelayMilliseconds = milliseconds;
  }

  resetRequestCount() {
    this.requestCount = 0;
  }

  getRequestCount() {
    return this.requestCount;
  }

  get url() {
    const address = this.server?.address();
    if (!address || typeof address === 'string') {
      throw new Error('External heroes API stub is not running');
    }

    return `http://127.0.0.1:${address.port}/heroStats`;
  }

  async close() {
    if (!this.server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}
