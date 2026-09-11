FROM node:22-alpine
RUN npm install --global newman@6.2.1
ENTRYPOINT ["newman"]
