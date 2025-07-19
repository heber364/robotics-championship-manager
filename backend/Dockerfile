FROM node:20-alpine

WORKDIR /usr/src/app

COPY . .

RUN yarn --quiet --no-optional --no-fund --loglevel=error

RUN yarn prisma generate

RUN yarn prisma:prd:deploy

RUN yarn build

CMD ["yarn", "start:prod"]

EXPOSE 3000
