FROM node:20-bullseye

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update
RUN apt-get install -y wget
RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt-get install -y ./google-chrome-stable_current_amd64.deb

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build && npm prune --production

EXPOSE 3000
ENTRYPOINT ["npm", "start"]