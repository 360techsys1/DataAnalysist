# Hilal Foods Chatbot - Setup Guide

## ✅ Conversion Complete!

Your school chatbot has been successfully converted to a **Hilal Foods Data Analysis Chatbot** with:

- ✅ SQL Server connection (replaced Supabase)
- ✅ OpenAI GPT-4 integration (replaced Groq)
- ✅ Dynamic text-to-SQL query generation
- ✅ Zero hallucinations - strict data-driven responses
- ✅ Rich markdown formatting with headings, icons, tables
- ✅ Removed authentication (direct access)
- ✅ Updated branding to Hilal Foods

## 📋 Quick Start

### 1. Backend Setup

Navigate to the server directory:
```bash
cd server
```

Install dependencies (if not already done):
```bash
npm install
```

Create `.env` file in the `server` directory:
```env
# SQL Server Database Configuration
# Option 1: Separate server and port (recommended)
DB_SERVER=149.102.144.78
DB_PORT=2043

# Option 2: Combined format (also supported)
# DB_SERVER=149.102.144.78,2043

DB_DATABASE=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Server Configuration
PORT=4000
```

**Important:** The server address format supports both:
- **Separate format**: `DB_SERVER=149.102.144.78` and `DB_PORT=2043` (recommended)
- **Combined format**: `DB_SERVER=149.102.144.78,2043` (port will be extracted automatically)

**Important:** Replace the placeholder values with your actual:
- SQL Server connection details
- OpenAI API key (get from https://platform.openai.com/api-keys)

Start the backend:
```bash
npm run dev
```

You should see:
```
Hilal Foods backend listening on http://localhost:4000
✅ Database connection successful
```

### 2. Frontend Setup

Navigate to the root directory:
```bash
cd ..
```

Install dependencies (if not already done):
```bash
npm install
```

Create `.env` file (optional, defaults to localhost:4000):
```env
VITE_API_BASE_URL=http://localhost:4000
```

Start the frontend:
```bash
npm run dev
```

Open your browser to the URL shown (usually http://localhost:5173)

## 🎯 Example Questions

Try asking the chatbot:

**Sales Analysis:**
- "What are the top 10 distributors by sales in the last 6 months?"
- "Which distributor sold the most units in February 2025?"
- "What are the total sales for the last quarter?"

**Product Analysis:**
- "What is the best-selling product in the last year's first quarter?"
- "Which products were sold most between October 25 and November 30?"
- "Show me products with the highest sales volume"

**Distributor Performance:**
- "List top 10 distributors in terms of sales and their top 3 selling products"
- "Which distributors are performing well in the last 6 months?"
- "Compare sales performance across different regions"

**Business Insights:**
- "Based on the last 2 years of sales, predict next year's performance"
- "Identify the most demanded products based on last 6 months"
- "Show me trends in order cancellations"

## 🏗️ Architecture

### Backend (`server/`)
- **Express API** on port 4000
- **SQL Server** connection via `mssql` package
- **OpenAI GPT-4** for:
  - Text-to-SQL generation
  - Formatted answer generation
- **Safety checks** - Only SELECT queries allowed
- **Connection pooling** for efficiency

### Frontend (`src/`)
- **React** with Vite
- **React Markdown** for rich text rendering
- Calls backend API at `/api/chat`
- Beautiful, responsive UI with gradient design

## 🔒 Security Features

- ✅ Only SELECT queries allowed (INSERT, UPDATE, DELETE blocked)
- ✅ SQL injection protection
- ✅ Input validation
- ✅ Connection pooling
- ✅ Environment variables for secrets

## 📊 Database Schema

The system understands these Hilal Foods tables:

1. **DIMDISTRIBUTION_MASTER** - Distributor master data
2. **DIMDISTRIBUTION_LOCATION** - Distributor locations (zones, regions, areas)
3. **DIMPRODUCT** - Product master data
4. **FACT_SALES_ORDER** - Primary sales orders
5. **FACT_SECONDARY_SALES** - Secondary/market sales

See `server/src/schemaConfig.js` for detailed schema information.

## 🚀 Deployment Tips

### Backend
- Set `NODE_ENV=production`
- Use process manager (PM2) for production
- Ensure SQL Server is accessible from server
- Keep OpenAI API key secure

### Frontend
- Build for production: `npm run build`
- Serve with a static file server or CDN
- Update `VITE_API_BASE_URL` to production backend URL

## 🐛 Troubleshooting

**Backend won't start:**
- Check `.env` file exists and has correct values
- Verify SQL Server connection details
- Ensure OpenAI API key is valid

**Database connection fails:**
- Verify SQL Server is accessible
- Check firewall settings
- Verify credentials in `.env`

**Frontend can't connect to backend:**
- Ensure backend is running on port 4000
- Check `VITE_API_BASE_URL` in frontend `.env`
- Check browser console for CORS errors

**Queries return errors:**
- Check backend logs for SQL errors
- Verify database schema matches `schemaConfig.js`
- Ensure user has SELECT permissions on tables

## 📝 Next Steps

1. Test with your actual SQL Server database
2. Customize schema description in `server/src/schemaConfig.js` if needed
3. Adjust OpenAI prompts in `server/src/llm.js` for better responses
4. Add more example questions to the welcome message
5. Customize UI colors/branding in `src/chat.css`

## 🎨 Customization

**Change company name/branding:**
- Update `src/Chat.jsx` welcome message
- Update `index.html` title
- Update `src/chat.css` colors

**Add more tables:**
- Update `server/src/schemaConfig.js` with new table descriptions
- No code changes needed - LLM will understand new schema

**Change AI model:**
- Update `OPENAI_MODEL` in backend `.env` (e.g., `gpt-4-turbo`, `gpt-3.5-turbo`)

---

**Need help?** Check the code comments or database schema documentation.

