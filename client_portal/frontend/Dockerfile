FROM node:20-alpine

WORKDIR /app

# Install dependencies first for faster caching
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copy the rest of the source
COPY . .

# Expose Vite's default dev port
EXPOSE 5173

# Run the live dev server
CMD ["npm", "run", "dev", "--", "--host"]
