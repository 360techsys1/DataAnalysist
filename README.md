# Hilal Foods Data Analysis Chatbot

An intelligent business analytics chatbot for Hilal Foods that connects to SQL Server database and provides data insights using OpenAI GPT-4.

## Features

- 📊 **Dynamic SQL Query Generation** - Converts natural language questions into SQL queries
- 🔒 **Safe Query Execution** - Only allows SELECT queries, blocks all destructive operations
- 🎯 **Zero Hallucinations** - All responses are based strictly on actual database data
- 💼 **Professional Formatting** - Rich markdown responses with headings, tables, and proper structure
- 🏢 **Business Intelligence** - Analyzes sales, distributors, products, and business metrics
- 🚀 **Enterprise Ready** - Scalable architecture with connection pooling

## Project Structure

```
hilal-foods-chatbot/
├── server/                 # Backend API server
│   ├── src/
│   │   ├── server.js      # Express server setup
│   │   ├── db.js          # SQL Server connection
│   │   ├── llm.js         # OpenAI integration & SQL generation
│   │   ├── schemaConfig.js # Database schema description
│   │   └── routes/
│   │       └── chat.js    # Chat API endpoint
│   └── package.json
├── src/                    # React frontend
│   ├── App.jsx
│   ├── Chat.jsx           # Main chat component
│   └── chat.css           # Styling
└── package.json
```

## Setup Instructions

### 1. Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:
```env
DB_SERVER=your_sql_server_host
DB_DATABASE=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

PORT=4000
```

Start backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
npm install
```

Create `.env` (optional, defaults to localhost:4000):
```env
VITE_API_BASE_URL=http://localhost:4000
```

Start frontend:
```bash
npm run dev
```

## Usage

1. Start both backend and frontend servers
2. Open the frontend in your browser (usually http://localhost:5173)
3. Ask questions like:
   - "What are the top 10 distributors by sales in the last 6 months?"
   - "Which products were sold most between October and November?"
   - "Show me the best-selling product in the last quarter"
   - "Compare sales performance across different regions"

## Database Schema

The system works with Hilal Foods database tables:
- `DIMDISTRIBUTION_MASTER` - Distributor master data
- `DIMDISTRIBUTION_LOCATION` - Distributor locations
- `DIMPRODUCT` - Product master data
- `FACT_SALES_ORDER` - Primary sales orders
- `FACT_SECONDARY_SALES` - Secondary/market sales

See `server/src/schemaConfig.js` for detailed schema information.

## Technology Stack

- **Frontend**: React, Vite, React Markdown
- **Backend**: Node.js, Express
- **Database**: SQL Server (mssql package)
- **AI**: OpenAI GPT-4
- **Styling**: CSS with gradients and modern design

## Security

- Only SELECT queries are allowed (INSERT, UPDATE, DELETE are blocked)
- SQL injection protection through input validation
- Connection pooling for database efficiency
- Environment variables for sensitive credentials
