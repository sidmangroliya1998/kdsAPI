# Use the specified base image
FROM baseimage AS builder

# Install Redis
USER root
RUN apt-get update && apt-get install -y redis-server

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the app
COPY . .

# Copy the environment file
COPY  .env .

RUN chmod -R 777 /usr/src/app/upload

# Create a symbolic link for i18n
RUN ln -s /usr/src/app/src/i18n /usr/src/app/i18n

# Build the app
RUN npm run build

# Create a directory for jest and set permissions
RUN mkdir /tmp/jest_rs && chmod 777 /tmp/jest_rs


# Switch back to root to set ownership
RUN chown -R root:root /tmp/jest_rs

# Switch back to the node user
USER node

# Expose the port your server is running on
EXPOSE 3000

# Start Redis server, check its version, and then run the Node.js app
CMD redis-server --daemonize yes && \
    redis-server --version && \
    redis-cli ping && \
    node dist/src/main.js