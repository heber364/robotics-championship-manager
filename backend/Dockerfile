FROM node:20-alpine

WORKDIR /usr/src/app

COPY . .

RUN yarn --quiet --no-optional --no-fund --loglevel=error

# Run prisma generate
RUN yarn prisma generate

# Run database migrations
RUN yarn prisma:prd:deploy

RUN yarn build

CMD ["yarn", "start:prod"]

EXPOSE 3000
