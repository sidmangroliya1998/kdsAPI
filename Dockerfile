# Stage 1: Build the application
# Use a Node.js base image that supports apt-get for installing Redis.
# node:lts (or node:20 if you prefer a specific version) is a good choice.
FROM node:lts AS builder

# Install Redis
# Switch to root user temporarily to install system-level packages
USER root
RUN apt-get update && apt-get install -y redis-server && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
# We copy these first to leverage Docker's layer caching.
COPY package*.json ./
# Use npm ci for clean and consistent installs in CI/CD environments
RUN npm ci

# Copy the rest of the app source code
COPY . .

# Copy the environment file
# Ensure your .env file is in the same directory as your Dockerfile
COPY .env .

# Set permissions for the upload directory
# This assumes /usr/src/app/upload exists or will be created by your app.
RUN chmod -R 777 /usr/src/app/upload

# Create a symbolic link for i18n
# This assumes /usr/src/app/src/i18n exists.
RUN ln -s /usr/src/app/src/i18n /usr/src/app/i18n

# Build the app (e.g., for production, assuming 'npm run build' creates dist/)
RUN npm run build

# Create a directory for jest and set permissions
# This is typically for test runners; ensure it's needed in the final image.
RUN mkdir -p /tmp/jest_rs && chmod 777 /tmp/jest_rs

# Switch back to root to set ownership (if needed, otherwise can be skipped)
# This might be redundant if the directory is already created by root.
RUN chown -R root:root /tmp/jest_rs

# Switch back to the default non-root user (node user provided by Node.js image)
# This is a security best practice.
USER node

# Expose the port your server is running on
EXPOSE 3000

# Start Redis server in the background, check its version, ping Redis, and then run the Node.js app
# Using 'redis-server --daemonize yes' is generally not recommended in Docker
# as it detaches the process, making it hard for Docker to manage.
# A better approach is to run Redis in a separate service in Docker Compose,
# or run it in the foreground and use a process manager like 'supervisord'
# if you absolutely need multiple processes in one container.
# For simplicity, if you must run it in the same container,
# you could try running it in the background and then your node app.
# However, the standard Docker way is one process per container.

# Revised CMD: Start Redis in background, wait a bit, then start Node.js app.
# This is a workaround for running multiple processes.
# For production, consider a separate Redis container via Docker Compose.
CMD (redis-server --daemonize yes && \
     sleep 5 && \
     redis-cli ping) && \
    node dist/src/main.js
