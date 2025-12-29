# Hilal Foods Backend Server

Backend API server for the Hilal Foods Data Analysis Chatbot.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `server` directory:
```env
# SQL Server Database Configuration
# Format 1: Separate server and port
DB_SERVER=149.102.144.78
DB_PORT=2043

# Format 2: Combined format (server,port) - also supported
# DB_SERVER=149.102.144.78,2043

DB_DATABASE=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

# LLM Provider Configuration
# Set LLM_PROVIDER to 'openai', 'ollama', or 'groq'
LLM_PROVIDER=openai

# OpenAI Configuration (required if LLM_PROVIDER=openai)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Ollama Configuration (required if LLM_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b-instruct-q5_K_M

# Groq Configuration (required if LLM_PROVIDER=groq)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-70b-versatile

# Server Configuration
PORT=4000
```

**Note:** You can use either format for server address:
- Separate: `DB_SERVER=149.102.144.78` and `DB_PORT=2043`
- Combined: `DB_SERVER=149.102.144.78,2043` (port will be extracted automatically)

3. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:4000`

## Switching LLM Providers

You can easily switch between different LLM providers by setting the `LLM_PROVIDER` environment variable:

- **OpenAI**: Set `LLM_PROVIDER=openai` (default) and provide `OPENAI_API_KEY`
- **Ollama**: Set `LLM_PROVIDER=ollama` and ensure Ollama is running locally
- **Groq**: Set `LLM_PROVIDER=groq` and provide `GROQ_API_KEY`

The application logic remains unchanged - just update the environment variable and the corresponding API key. All providers use the same interface, so your application code doesn't need any modifications.

## API Endpoints

### POST /api/chat

Send a question to get data analysis.

**Request:**
```json
{
  "question": "What are the top 10 distributors by sales?",
  "history": [
    { "role": "user", "content": "previous question" },
    { "role": "assistant", "content": "previous answer" }
  ]
}
```

**Response:**
```json
{
  "answer": "Formatted markdown answer with insights...",
  "rowCount": 10,
  "sql": "SELECT TOP 10..."
}
```

### GET /health

Health check endpoint.

