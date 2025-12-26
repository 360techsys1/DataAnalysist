# Quick Guide: Switch Between OpenAI and Ollama

## 🔄 How to Switch

### Use Ollama (Free, Self-hosted)

Edit `server/.env`:
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://31.97.220.81:11434
OLLAMA_MODEL=llama3.1:8b-instruct-q5_K_M
```

**Or use the smaller model:**
```env
OLLAMA_MODEL=qwen2.5:3b-instruct-q4_0
```

### Use OpenAI (Production, Paid)

Edit `server/.env`:
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4
```

## 📝 Complete .env Example

### For Ollama (Testing):
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://31.97.220.81:11434
OLLAMA_MODEL=llama3.1:8b-instruct-q5_K_M

# Database config
DB_SERVER=149.102.144.78
DB_PORT=1433
DB_DATABASE=your_db
DB_USER=your_user
DB_PASSWORD=your_pass
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# OpenAI (optional, for fallback)
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4
```

### For OpenAI (Production):
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4

# Database config (same as above)
DB_SERVER=149.102.144.78
DB_PORT=1433
DB_DATABASE=your_db
DB_USER=your_user
DB_PASSWORD=your_pass
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# Ollama (optional, not used)
OLLAMA_BASE_URL=http://31.97.220.81:11434
OLLAMA_MODEL=llama3.1:8b-instruct-q5_K_M
```

## ✅ After Changing .env

1. **Restart your backend:**
   ```bash
   cd server
   npm run dev
   ```

2. **Check logs** - you should see:
   ```
   🤖 Using LLM Provider: OLLAMA
   ```
   or
   ```
   🤖 Using LLM Provider: OPENAI
   ```

3. **Test health endpoint:**
   ```bash
   curl http://localhost:4000/health
   ```
   
   Response will show which provider is active:
   ```json
   {
     "status": "ok",
     "database": "connected",
     "llm": {
       "provider": "ollama",
       "model": "llama3.1:8b-instruct-q5_K_M",
       "baseUrl": "http://31.97.220.81:11434"
     }
   }
   ```

## 🎯 Recommended Usage

- **Development/Testing:** Use Ollama (no token costs)
- **Production:** Use OpenAI (better quality, but costs tokens)

## 💡 Tip

You can keep both configured in `.env` - just change `LLM_PROVIDER` to switch!

