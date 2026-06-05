# Stage 1: Build the React application using Node 22 (Fixes Vite version requirement)
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./
RUN npm install

# Copy the rest of your source files
COPY . .

# Compile and build the React app for production
RUN npm run build

# Stage 2: Serve the compiled static assets using Nginx
FROM nginx:alpine

# Copy the build assets from the 'builder' stage into Nginx's serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 inside the container environment
EXPOSE 80

# Run Nginx in the foreground so the container stays active
CMD ["nginx", "-g", "daemon off;"]