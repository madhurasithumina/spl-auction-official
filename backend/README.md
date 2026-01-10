# SPL Auction Backend

Backend API for SPL Cricket Auction System built with Node.js, Express, and MongoDB.

## Installation

```bash
npm install
```

## Environment Variables

The `.env` file contains:
- `PORT=5000` - Server port
- `MONGO_URI` - MongoDB connection string (already configured)

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Player Registration
- `POST /api/players` - Register new player
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID

## Dependencies

- express - Web framework
- mongoose - MongoDB ODM
- cors - Enable CORS
- dotenv - Environment variables
- body-parser - Parse request bodies

## Dev Dependencies

- nodemon - Auto-reload server on changes
