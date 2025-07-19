FROM node:20-alpine

WORKDIR /usr/src/app

COPY . .

RUN yarn --quiet --no-optional --no-fund --loglevel=error
RUN yarn prisma generate

RUN yarn build

EXPOSE 3000

CMD ["sh", "-c", "yarn prisma:prd:deploy && yarn start:prod"]