// Vercel serverless function for chat endpoint
// This file is in server/api/chat.js for separate backend deployment
import { runQuery } from '../src/db.js';
import { 
  generateSqlFromQuestion, 
  answerFromData,
  isSqlSafe,
  isConversationalMessage,
  handleConversationalMessage,
  isMetadataQuestion,
  handleMetadataQuestion,
  extractTableFromSql
} from '../src/llm.js';

// Helper function to set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function handleRequest(req, res) {
  // Handle CORS - Set headers first, before anything else
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, history = [] } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ 
        error: 'Please provide a question',
        message: 'Your question cannot be empty. Please ask something about your business data.'
      });
    }

    // Check if message is asking about previous query metadata (table used, data source)
    const lastMessage = history[history.length - 1];
    const lastSql = lastMessage?.sql || null;
    const lastTable = lastMessage?.table || null;
    
    if (isMetadataQuestion(question, history)) {
      console.log('Detected metadata question about previous query...');
      const metadataResponse = await handleMetadataQuestion(question, history, lastSql, lastTable);
      return res.json({
        answer: metadataResponse,
        rowCount: 0,
        type: 'metadata'
      });
    }

    // Check if message is conversational (not a data query)
    if (isConversationalMessage(question, history)) {
      console.log('Detected conversational message, handling conversationally...');
      const conversationalResponse = await handleConversationalMessage(question, history);
      return res.json({
        answer: conversationalResponse,
        rowCount: 0,
        type: 'conversational'
      });
    }

    // Generate SQL from question
    console.log('Generating SQL for question:', question);
    let sql;
    try {
      sql = await generateSqlFromQuestion(question, history);
    } catch (error) {
      // Check for Ollama timeout errors
      if (error.message && error.message.includes('timeout')) {
        console.error('❌ Ollama timeout error:', error.message);
        return res.status(504).json({
          error: 'Request timeout',
          message: `⏱️ **Ollama Server Timeout**

Your self-hosted Ollama server took too long to respond (over 55 seconds). This usually happens when:

• Ollama server is slow or overloaded
• The model is processing a complex request
• Network latency between Vercel and your Ollama server

**Try:**
• Simplifying your question
• Checking if your Ollama server is running properly
• Waiting a moment and trying again
• Using a faster model (if available)`,
          type: 'timeout'
        });
      }
      
      // Handle SQL generation/safety errors - friendly message without suggestions
      const errorType = error.message === 'SQL_SAFETY_CHECK_FAILED' ? 'SQL_SAFETY_CHECK_FAILED' : 'SQL_GENERATION_FAILED';
      console.error(`❌ ${errorType}:`, error.message);
      
      // Check if it's an LLM API error (network, timeout, etc.)
      if (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('API')) {
        return res.status(500).json({
          error: 'LLM Service Error',
          message: `I'm having trouble connecting to the AI service right now. This might be because:\n\n• The LLM service (OpenAI/Ollama/Groq) is temporarily unavailable\n• There's a network connectivity issue\n• The request timed out\n\n**Please try again in a moment.** If the problem persists, check your LLM provider configuration.`,
          rowCount: 0,
          type: 'service_error'
        });
      }
      
      // Friendly error message without suggestions
      return res.json({
        answer: `I'm having a bit of trouble understanding exactly what you're looking for. 😊

**Could you help me by being more specific?** For example:

• **Time periods**: "last 6 months", "2024", "past 3 years", "past 10 days"
• **What you want**: "top 10 products", "total sales", "distributor rankings"
• **Any filters**: specific product names, distributor names, regions

**Here are some example questions that work well:**
• "Show me the top 10 distributors by sales in the last 6 months"
• "List top 10 products from past 10 days in terms of sales"
• "What are the top 3 best-selling products for each of the top 10 distributors?"
• "Show me year-over-year sales growth for 2022, 2023, and 2024"

Feel free to ask again with more details!`,
        rowCount: 0,
        type: 'clarification_needed'
      });
    }

    // Safety check (redundant but extra safety)
    if (!isSqlSafe(sql)) {
      console.error('❌ SQL Safety Check Failed (redundant check):', sql);
      return res.status(400).json({
        error: 'Query validation failed',
        message: `The generated query didn't pass safety validation. Please rephrase your question with more specific details.

**Try being more specific:**
• Add time periods (e.g., "last month", "January 2024")
• Specify what you want to see (e.g., "top 10", "total sales")
• Include product or distributor names if relevant`
      });
    }

    // Execute query
    console.log('Executing SQL query...');
    let rows, rowCount;
    try {
      const result = await runQuery(sql);
      rows = result.rows;
      rowCount = result.rowCount;
      console.log(`✅ Query executed successfully. Returned ${rowCount} rows`);
    } catch (error) {
      console.error('❌ Query execution error:', error);
      
      // Check for SQL syntax errors (ORDER BY in CTE, etc.)
      const hasSqlSyntaxError = error.message.includes('ORDER BY') || 
                                 error.message.includes('syntax') || 
                                 error.message.includes('invalid') ||
                                 error.originalError?.message?.includes('ORDER BY');
      
      // If SQL syntax error, provide helpful suggestions for complex queries
      if (hasSqlSyntaxError) {
        const errorDetail = error.originalError?.message || error.message;
        const isOrderByError = errorDetail.includes('ORDER BY');
        
        let suggestionMessage = `I encountered a SQL syntax error while generating the query. This usually happens with complex queries that need ranking/sorting.

**The issue:** ${isOrderByError ? 'ORDER BY cannot be used in CTEs (Common Table Expressions) without TOP/OFFSET in SQL Server' : 'SQL syntax error in generated query'}`;

        // Check if the question was about top distributors/products
        if (/top.*distribut.*product|distribut.*top.*product|hero product/i.test(question)) {
          suggestionMessage += `

**For questions like "top X distributors and their top Y products", try these clearer versions:**

1. "Show me the top 3 distributors by total sales, and for each distributor, show their top 2 best-selling products"
2. "What are the top 3 distributors by sales amount, and what are their top 2 products by sales?"
3. "List top 3 distributors with their highest selling products - show 2 products per distributor"

**Tips for better questions:**
• Be specific: "by sales amount" or "by quantity" instead of just "top"
• Use "for each" or "per distributor" to clarify grouping
• Specify the ranking criteria clearly`;
        } else {
          suggestionMessage += `

**Here's how to improve your question:**

**Tips:**
• Break complex questions into simpler parts
• Be specific about what "top" means (by sales amount, by quantity, by count)
• Specify time periods clearly (e.g., "last 3 months", "2024")
• Use clear grouping phrases like "for each" or "per"

**Example improvements:**
• Instead of: "top distributors and products"
• Try: "Show me top 10 distributors by total sales amount"`;
        }
        
        return res.json({
          answer: suggestionMessage,
          rowCount: 0,
          type: 'error_with_suggestions',
          sqlError: error.message
        });
      }
      
      // Generic database error
      return res.status(500).json({
        error: 'Database query failed',
        message: `I couldn't retrieve the data you requested. This might be because:
• The data doesn't exist in the database
• The query couldn't find matching records
• There's a temporary database issue

**Please try:**
• Rephrasing your question
• Using different time periods
• Being more specific about what you're looking for

**Example:** "Show me top 5 distributors by sales last month" instead of "show me sales"`,
        sqlError: error.message
      });
    }

    // Handle empty results with helpful message
    if (rowCount === 0) {
      console.log('⚠️ Query returned 0 rows');
      const emptyResultMessage = `I couldn't find any data matching your query. This could be because:

• **No records exist** for the specified criteria (time period, product, distributor, etc.)
• **The search terms don't match** any data in the database
• **The time period** you mentioned is outside the available data range

**Try:**
• Using a different time period
• Checking if product/distributor names are spelled correctly
• Being less specific to see what data is available
• Asking: "What data is available?" or "Show me recent sales"

**Example questions:**
• "Show me all distributors"
• "What are the top 10 products by sales?"
• "List recent sales orders"`;

      return res.json({
        answer: emptyResultMessage,
        rowCount: 0,
        type: 'empty_result'
      });
    }

    // Generate formatted answer from results
    console.log('Generating formatted answer...');
    let answer;
    try {
      answer = await answerFromData(question, rows, { sql, rowCount });
    } catch (error) {
      console.error('❌ Answer generation error:', error);
      
      // Check for Ollama timeout errors during answer generation
      if (error.message && error.message.includes('timeout')) {
        console.error('❌ Ollama timeout during answer generation:', error.message);
        return res.status(504).json({
          error: 'Request timeout',
          message: `⏱️ **Ollama Server Timeout**

Your self-hosted Ollama server took too long to format the response. However, I did retrieve the data successfully.

**Query Results:** ${rowCount} records found.

**Data:**\n\`\`\`json\n${JSON.stringify(rows.slice(0, 10), null, 2)}\n\`\`\`

${rowCount > 10 ? `*(Showing first 10 of ${rowCount} results)*` : ''}

**To fix timeout issues:**
• Simplify your questions
• Check if your Ollama server is running properly
• Try using a faster model`,
          rowCount,
          type: 'timeout_with_data'
        });
      }
      
      // Fallback: return data in simple format
      return res.json({
        answer: `## 📊 Query Results\n\nFound ${rowCount} records.\n\n**Data:**\n\`\`\`json\n${JSON.stringify(rows.slice(0, 10), null, 2)}\n\`\`\`\n\n${rowCount > 10 ? `*(Showing first 10 of ${rowCount} results)*` : ''}`,
        rowCount,
        type: 'fallback'
      });
    }

    // Extract table information for context tracking
    const tableUsed = extractTableFromSql(sql);

    res.json({
      answer,
      rowCount,
      type: 'success',
      sql: sql, // Full SQL query
      table: tableUsed // Track which table was used for follow-up questions
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    // Ensure CORS headers are set even on error
    setCorsHeaders(res);
    
    // Check for timeout errors
    if (error.message && error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Request timeout',
        message: `⏱️ **Request Timeout**

The request took too long to complete. This usually happens when:

• Your Ollama server is slow or overloaded
• Network latency is high
• The question requires complex processing

**Try:**
• Simplifying your question
• Checking if your Ollama server is accessible
• Waiting a moment and trying again`,
        type: 'timeout'
      });
    }
    
    res.status(500).json({
      error: 'An unexpected error occurred',
      message: `I encountered an unexpected error while processing your request. Please try again in a moment.

If the problem persists, try rephrasing your question or breaking it into smaller parts.`
    });
  }
}

export default async function handler(req, res) {
  try {
    setCorsHeaders(res);
    await handleRequest(req, res);
  } catch (error) {
    console.error('Handler wrapper error:', error);
    setCorsHeaders(res);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
}

