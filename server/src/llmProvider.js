// LLM Provider - Supports OpenAI, Ollama, and Groq
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'; // 'openai', 'ollama', or 'groq'
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b-instruct-q5_K_M';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

let openaiClient = null;
let groqClient = null;

// Initialize OpenAI client (only if using OpenAI)
if (LLM_PROVIDER === 'openai') {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ Warning: OPENAI_API_KEY not set, but LLM_PROVIDER is set to openai');
  } else {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
}

// Initialize Groq client (only if using Groq)
if (LLM_PROVIDER === 'groq') {
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️ Warning: GROQ_API_KEY not set, but LLM_PROVIDER is set to groq');
  } else {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
}

// Ollama API call helper
async function callOllama(messages, options = {}) {
  const {
    temperature = 0.7,
    max_tokens = 2000,
  } = options;

  // Ollama chat API format - messages should already be in correct format
  // Extract system message if present
  const systemMessages = messages.filter(msg => msg.role === 'system');
  const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
  
  // Combine system messages into one
  const systemPrompt = systemMessages.length > 0 
    ? systemMessages.map(msg => msg.content).join('\n\n')
    : null;

  // Ollama uses the /api/chat endpoint with messages array
  const requestBody = {
    model: OLLAMA_MODEL,
    messages: nonSystemMessages, // Ollama handles system messages differently
    options: {
      temperature: temperature,
      num_predict: max_tokens, // Ollama uses num_predict instead of max_tokens
    },
    stream: false, // We want complete response, not streaming
  };

  // Add system message to options if present
  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  // Add timeout to prevent hanging - 55 seconds to stay under Vercel's 60s limit
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 seconds

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal, // Add timeout signal
    });

    clearTimeout(timeoutId); // Clear timeout if request completes successfully
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.message || !data.message.content) {
      throw new Error('Invalid response from Ollama API');
    }

    return {
      content: data.message.content,
      model: data.model,
      usage: data.eval_count ? {
        total_tokens: data.eval_count + data.prompt_eval_count,
        prompt_tokens: data.prompt_eval_count,
        completion_tokens: data.eval_count,
      } : null,
    };
  } catch (error) {
    clearTimeout(timeoutId); // Ensure timeout is cleared
    
    if (error.name === 'AbortError') {
      throw new Error('Ollama request timeout: Your self-hosted Ollama server took too long to respond (over 55 seconds). Please check if Ollama is running and try again.');
    }
    
    // Re-throw other errors
    throw error;
  }
}

// OpenAI API call helper
async function callOpenAI(messages, options = {}) {
  const {
    temperature = 0.7,
    max_tokens = 2000,
    model = OPENAI_MODEL,
  } = options;

  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Check OPENAI_API_KEY environment variable.');
  }

  const completion = await openaiClient.chat.completions.create({
    model: model,
    messages: messages,
    temperature: temperature,
    max_tokens: max_tokens,
  });

  return {
    content: completion.choices[0].message.content,
    model: completion.model,
    usage: completion.usage,
  };
}

// Groq API call helper
async function callGroq(messages, options = {}) {
  const {
    temperature = 0.7,
    max_tokens = 2000,
    model = GROQ_MODEL,
  } = options;

  if (!groqClient) {
    throw new Error('Groq client not initialized. Check GROQ_API_KEY environment variable.');
  }

  const completion = await groqClient.chat.completions.create({
    model: model,
    messages: messages,
    temperature: temperature,
    max_tokens: max_tokens,
  });

  return {
    content: completion.choices[0].message.content,
    model: completion.model,
    usage: completion.usage,
  };
}

// Universal LLM call function - switches between providers
export async function callLLM(messages, options = {}) {
  const provider = LLM_PROVIDER.toLowerCase();

  console.log(`🤖 Using LLM Provider: ${provider.toUpperCase()}`);

  if (provider === 'ollama') {
    try {
      return await callOllama(messages, options);
    } catch (error) {
      console.error('❌ Ollama API error:', error);
      // If Ollama fails and OpenAI is available, fallback to OpenAI
      if (process.env.OPENAI_API_KEY && LLM_PROVIDER === 'ollama') {
        console.log('⚠️ Ollama failed, falling back to OpenAI...');
        return await callOpenAI(messages, options);
      }
      throw error;
    }
  } else if (provider === 'openai') {
    return await callOpenAI(messages, options);
  } else if (provider === 'groq') {
    return await callGroq(messages, options);
  } else {
    throw new Error(`Unknown LLM_PROVIDER: ${LLM_PROVIDER}. Use 'openai', 'ollama', or 'groq'`);
  }
}

// Get current provider info
export function getLLMProviderInfo() {
  let model, baseUrl;
  
  if (LLM_PROVIDER === 'openai') {
    model = OPENAI_MODEL;
    baseUrl = 'https://api.openai.com';
  } else if (LLM_PROVIDER === 'groq') {
    model = GROQ_MODEL;
    baseUrl = 'https://api.groq.com';
  } else {
    model = OLLAMA_MODEL;
    baseUrl = OLLAMA_BASE_URL;
  }
  
  return {
    provider: LLM_PROVIDER,
    model: model,
    baseUrl: baseUrl,
  };
}

