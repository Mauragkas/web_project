# Use official Node.js LTS image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port (default 3000)
EXPOSE 3000

# Create uploads and database directories if not exist
RUN mkdir -p public/uploads/thesis_drafts public/uploads/topics database

# Set environment variables (can be overridden in docker-compose)
ENV NODE_ENV=production
ENV SESSION_SECRET=changeme123
ENV BCRYPT_SALT_ROUNDS=10

# Start the app
CMD ["node", "src/app.js"]
