FROM node:10
WORKDIR /app
COPY package.json /app
RUN yarn
COPY . /app
CMD yarn run start
EXPOSE 5000