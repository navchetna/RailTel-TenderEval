# Build stage
FROM node:18-alpine

# Set proxy environment variables for Intel network
ENV http_proxy=http://proxy-dmz.intel.com:912
ENV https_proxy=http://proxy-dmz.intel.com:912
ENV no_proxy=127.0.0.1,localhost,intel.com,.intel.com,g2-wyn04.iind.intel.com
ENV NO_PROXY=127.0.0.1,localhost,intel.com,.intel.com,g2-wyn04.iind.intel.com
# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to handle React 18 conflicts
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_BASE_URL=http://g2-wyn04.iind.intel.com:8050
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN npm run build

# Expose port (Vite preview runs on 4173 by default)
EXPOSE 4173

# Start the application
CMD ["npm", "start"]