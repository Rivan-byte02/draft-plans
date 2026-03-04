FROM node:20-alpine

WORKDIR /workspace

COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/shared/src packages/shared/src
COPY apps/api/package.json apps/api/package.json

WORKDIR /workspace/apps/api

RUN npm install

WORKDIR /workspace
COPY apps/api apps/api

WORKDIR /workspace/apps/api

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

CMD ["sh", "./docker-entrypoint.sh"]
