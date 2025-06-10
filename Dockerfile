FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create content directory and set permissions
RUN mkdir -p src/content/pages && \
    chown -R node:node /app

# Switch to node user
USER node

# Expose port
EXPOSE 4321

# Development command
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]