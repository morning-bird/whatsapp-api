FROM node:20-bullseye

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build && npm prune --production

EXPOSE 3000
ENTRYPOINT ["npm", "start"]