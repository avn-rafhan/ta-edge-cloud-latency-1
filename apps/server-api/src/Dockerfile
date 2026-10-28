FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node server.js ./
COPY --chown=node:node dataset/dataset.csv ./dataset/dataset.csv
USER node
EXPOSE 3000
CMD ["node", "server.js"]