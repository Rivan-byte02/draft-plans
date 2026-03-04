FROM node:20-alpine

WORKDIR /workspace

COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/shared/src packages/shared/src
COPY apps/web/package.json apps/web/package.json

WORKDIR /workspace/apps/web

RUN npm install

WORKDIR /workspace
COPY apps/web apps/web

WORKDIR /workspace/apps/web

EXPOSE 5173

CMD ["npm", "run", "dev"]
