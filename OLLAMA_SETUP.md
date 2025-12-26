# Ollama Integration Guide

## 🚀 Quick Setup

### 1. Environment Variables

Add to your `.env` file in the `server/` directory:

```env
# Switch between OpenAI and Ollama
LLM_PROVIDER=ollama

# Ollama Configuration
OLLAMA_BASE_URL=http://31.97.220.81:11434
OLLAMA_MODEL=llama3.1:8b-instruct-q5_K_M

# Or use the other model:
# OLLAMA_MODEL=qwen2.5:3b-instruct-q4_0

# OpenAI (keep for fallback or switching back)
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4
```

### 2. Switch to OpenAI

Just change one line:

```env
LLM_PROVIDER=openai
```

That's it! The code automatically handles the rest.

---

## 📋 Environment Variables

### LLM Provider Selection

| Variable | Options | Default | Description |
|----------|---------|---------|-------------|
| `LLM_PROVIDER` | `openai` or `ollama` | `openai` | Which LLM provider to use |

### OpenAI Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes (if using OpenAI) | - | Your OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4` | OpenAI model to use |

### Ollama Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | Your Ollama server URL |
| `OLLAMA_MODEL` | No | `llama3.1:8b-instruct-q5_K_M` | Model name installed in Ollama |

---

## 🎯 Available Models

You have these models installed on your Ollama server:

1. **llama3.1:8b-instruct-q5_K_M** (recommended for better quality)
   ```env
   OLLAMA_MODEL=llama3.1:8b-instruct-q5_K_M
   ```

2. **qwen2.5:3b-instruct-q4_0** (faster, smaller)
   ```env
   OLLAMA_MODEL=qwen2.5:3b-instruct-q4_0
   ```

---

## 🔄 Switching Providers

### Switch to Ollama

1. Edit `server/.env`:
   ```env
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://31.97.220.81:11434
   OLLAMA_MODEL=llama3.1:8b-instruct-q5_K_M
   ```

2. Restart your backend:
   ```bash
   cd server
   npm run dev
   ```

### Switch to OpenAI

1. Edit `server/.env`:
   ```env
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   ```

2. Restart your backend

---

## 🛠️ How It Works

1. **Unified Interface:** The `llmProvider.js` module provides a unified `callLLM()` function
2. **Automatic Switching:** Based on `LLM_PROVIDER` environment variable
3. **Fallback:** If Ollama fails and OpenAI is configured, it falls back to OpenAI
4. **Same API:** All LLM functions use the same interface, so switching is seamless

---

## 🧪 Testing

### Test Health Endpoint

```bash
curl http://localhost:4000/health
```

Response includes LLM provider info:
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

### Test Chat

Just use the chatbot UI - it will automatically use the configured provider!

---

## ⚠️ Important Notes

### Ollama Model Performance

- **llama3.1:8b-instruct-q5_K_M**: Better quality, slower
- **qwen2.5:3b-instruct-q4_0**: Faster, good for testing

### Network Access

Make sure your backend server can reach:
- Ollama server at `http://31.97.220.81:11434`
- Or use your local IP if running locally

### Fallback Behavior

If Ollama fails and `OPENAI_API_KEY` is set:
- System automatically falls back to OpenAI
- Logs will show: `⚠️ Ollama failed, falling back to OpenAI...`

---

## 🔍 Troubleshooting

### "Ollama API error: Connection refused"
- Check if Ollama server is running
- Verify `OLLAMA_BASE_URL` is correct
- Test: `curl http://31.97.220.81:11434/api/tags` (should list models)

### "Model not found"
- Check model name is correct: `llama3.1:8b-instruct-q5_K_M` or `qwen2.5:3b-instruct-q4_0`
- List installed models: `curl http://31.97.220.81:11434/api/tags`

### Slow Responses
- Try the smaller model: `qwen2.5:3b-instruct-q4_0`
- Check network latency to Ollama server
- Consider running Ollama locally for better performance

### Fallback to OpenAI
- Check server logs for error messages
- Verify Ollama server is accessible
- Check `OPENAI_API_KEY` is set for fallback

---

## 📊 Provider Comparison

| Feature | OpenAI | Ollama |
|---------|--------|--------|
| Cost | Per token | Free (self-hosted) |
| Speed | Fast | Depends on hardware |
| Quality | Excellent (GPT-4) | Good (7B-8B models) |
| Setup | API key | Install & run server |
| Best For | Production | Testing/Development |

---

## 🎉 Benefits

✅ **Easy Switching:** Change one environment variable  
✅ **Cost Savings:** Use Ollama for testing, OpenAI for production  
✅ **No Code Changes:** Same code works with both providers  
✅ **Automatic Fallback:** Falls back to OpenAI if Ollama fails  
✅ **Local Development:** Test without API costs  

