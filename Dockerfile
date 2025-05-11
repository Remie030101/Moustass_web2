FROM node:18

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend files
COPY backend/ ./

# Copy frontend files to the correct location
COPY frontend/ ../frontend/

# Copy uploads directory if it exists
COPY uploads/ ../uploads/

ENV PORT=3000

CMD [ "npm", "start" ]


