# Use the official Node.js 22 image as a base
FROM node:22

# Set the working directory in the container where the functions code will reside
WORKDIR /app/functions

# Copy package.json and package-lock.json specifically for the functions
COPY functions/package*.json ./

# Install dependencies for the functions
RUN npm install

# Copy the functions source code and tsconfig
COPY functions/src ./src
COPY functions/tsconfig.json ./

# Build the TypeScript code for the functions
RUN npx tsc

# Expose the port the app runs on
ENV PORT 8080
EXPOSE 8080

# Run the built application from the functions directory's dist folder
CMD ["node", "dist/index.js"]