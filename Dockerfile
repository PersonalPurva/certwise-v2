# CertWise server (the page + the live-check API) in a container.
#   docker build -t certwise .
#   docker run -p 5174:5174 certwise        then open http://localhost:5174
# The server uses only Node's built-in modules, so there is nothing to install.
FROM node:22-alpine
WORKDIR /app
COPY . .
ENV PORT=5174
EXPOSE 5174
USER node
CMD ["node", "serve.js"]
