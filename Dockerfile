# Use Node.js 18 (or a later version)
FROM node:18

# Create and set the working directory
WORKDIR /app

# Copy package.json files
COPY package*.json /app

# Install dependencies (you might want to use npm install instead of npm ci if not using a lock file)
RUN npm ci

# Copy the rest of the application files
COPY . /app

# Expose the application port (if needed)
EXPOSE 4200

# Run the application (if required)
CMD ["npm", "start"]
