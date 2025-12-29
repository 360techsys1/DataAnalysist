import express from 'express';
import { 
  generateSqlFromQuestion, 
  answerFromData, 
  isSqlSafe,
  isConversationalMessage,
  handleConversationalMessage,
  suggestRephrasedQuestion,
  isMetadataQuestion,
  handleMetadataQuestion,
  extractTableFromSql,
  extractEntitiesFromHistory,
  isFollowUpQuestion
} from '../llm.js';
import { runQuery } from '../db.js';

const router = express.Router();

// Check if user is confirming a suggested question
function isConfirmation(question, history = []) {
  const lowerQuestion = question.toLowerCase().trim();
  const confirmationPatterns = [
    /^(yes|yeah|yep|yup|sure|ok|okay|alright|correct|right|that's right|exactly|i want that|i mean that|yes i want|yes i mean)(\s|$|\.|!)/i,
    /^(yes|yeah|yep|yup|sure|ok|okay|alright|correct|right|that's right|exactly|i want that|i mean that|yes i want|yes i mean)\s+(i|to|want|mean)/i,
  ];
  
  // Check if last message was a suggestion
  const lastMessage = history[history.length - 1];
  const isSuggestion = lastMessage?.suggestedQuestion || lastMessage?.type === 'suggestion';
  
  return isSuggestion && confirmationPatterns.some(pattern => pattern.test(lowerQuestion));
}

// Check if user is rejecting a suggested question
function isRejection(question) {
  const lowerQuestion = question.toLowerCase().trim();
  const rejectionPatterns = [
    /^(no|nope|nah|not really|not exactly|that's not|incorrect|wrong)(\s|$|\.|!)/i,
  ];
  
  return rejectionPatterns.some(pattern => pattern.test(lowerQuestion));
}

// Chat endpoint - handles questions and generates SQL queries
router.post('/chat', async (req, res) => {
  try {
    const { question, history = [] } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ 
        error: 'Please provide a question',
        message: 'Your question cannot be empty. Please ask something about your business data.'
      });
    }

    // Extract entities from history for context
    const entities = extractEntitiesFromHistory(history);
    
    // Check if user is confirming a suggested question
    if (isConfirmation(question, history)) {
      const lastMessage = history[history.length - 1];
      const suggestedQuestion = lastMessage?.suggestedQuestion;
      if (suggestedQuestion) {
        console.log('User confirmed suggested question, proceeding with:', suggestedQuestion);
        // Proceed with the suggested question
        // We'll handle it in the normal flow by replacing the question
        req.body.question = suggestedQuestion;
        // Continue to normal processing below
      }
    }
    
    // Check if user is rejecting a suggested question
    if (isRejection(question)) {
      return res.json({
        answer: `No problem! Could you please rephrase your question with more specific details? For example:\n\n• Specify time periods (e.g., "last 6 months", "2024")\n• Be clear about what you want (e.g., "top 3 products per distributor")\n• Include any filters or criteria you have in mind\n\nI'm here to help once you provide more details!`,
        rowCount: 0,
        type: 'rejection'
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

    // Check if message is conversational (not a data query) - but allow confirmations through
    if (isConversationalMessage(question, history) && !isConfirmation(question, history)) {
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
      // Handle SQL generation/safety errors with intelligent rephrasing
      const errorType = error.message === 'SQL_SAFETY_CHECK_FAILED' ? 'SQL_SAFETY_CHECK_FAILED' : 'SQL_GENERATION_FAILED';
      console.error(`❌ ${errorType}:`, error.message);
      
      // Generate intelligent rephrased suggestion with context
      const suggestedQuestion = await suggestRephrasedQuestion(question, errorType, history, entities);
      
      if (suggestedQuestion && suggestedQuestion.toLowerCase() !== question.toLowerCase()) {
        // Return a friendly message asking if they meant the suggested question
        return res.json({
          answer: `I want to make sure I understand your question correctly! 🤔

**Did you mean to ask:**
> "${suggestedQuestion}"

You can simply reply with **"yes"** or **"yes, I want that"** and I'll fetch that data for you right away!

If that's not quite what you're looking for, feel free to rephrase your question with more specific details like:
• Time periods (e.g., "last 6 months", "2024")
• What data you want (e.g., "top 3 products per distributor")
• Any specific filters or criteria`,
          rowCount: 0,
          type: 'suggestion',
          suggestedQuestion: suggestedQuestion
        });
      } else {
        // Fallback if rephrasing also fails
        return res.json({
          answer: `I'm having a bit of trouble understanding exactly what you're looking for. 😊

**Could you help me by being more specific?** For example:

• **Time periods**: "last 6 months", "2024", "past 3 years"
• **What you want**: "top 3 products", "total sales", "distributor rankings"
• **Any filters**: specific product names, distributor names, regions

**Here are some example questions that work well:**
• "Show me the top 10 distributors by sales in the last 6 months"
• "What are the top 3 best-selling products for each of the top 10 distributors?"
• "Show me year-over-year sales growth for 2022, 2023, and 2024"

Feel free to ask again with more details!`,
          rowCount: 0,
          type: 'clarification_needed'
        });
      }
    }

    // Safety check (redundant but extra safety)
    if (!isSqlSafe(sql)) {
      console.error('❌ SQL Safety Check Failed (redundant check):', sql);
      return res.json({
        answer: `I want to help you get the right data! 🔒

For security reasons, I can only run read-only queries. Your question seems to require something that's not allowed.

**Could you try rephrasing with:**
• More specific time periods (e.g., "last 6 months", "2024")
• Clearer data requests (e.g., "top 10 distributors", "total sales")
• Specific filters if needed (product names, distributor names, etc.)

**Example:** Instead of "show me everything", try "Show me the top 10 distributors by sales in the last 6 months"`,
        rowCount: 0,
        type: 'safety_check_failed'
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
      
      // NEVER show technical SQL errors to users - always friendly messages
      if (hasSqlSyntaxError) {
        // Check if the question was about top distributors/products
        if (/top.*distribut.*product|distribut.*top.*product|hero product|best.*product.*each|each.*best.*product/i.test(question)) {
          const suggestedQuestion = await suggestRephrasedQuestion(question, 'SQL_SYNTAX_ERROR', history, entities);
          
          if (suggestedQuestion) {
            return res.json({
              answer: `I want to help you get exactly what you need! 😊

Your question is a bit complex for me to process directly. Let me suggest a clearer way to ask:

**Did you mean:**
> "${suggestedQuestion}"

Just reply with **"yes"** and I'll fetch that data for you!

**Or, if you want to try a different approach, here are some tips:**
• Be specific: "top 3 products per distributor" instead of "best products"
• Use clear grouping: "for each distributor" or "per distributor"
• Specify ranking: "by sales amount" or "by quantity"

**Example questions that work well:**
• "Show me the top 3 distributors by sales, and for each one, show their top 2 best-selling products"
• "What are the top 3 products for each of the top 10 distributors?"`,
              rowCount: 0,
              type: 'suggestion',
              suggestedQuestion: suggestedQuestion
            });
          }
        }
        
        // Generic friendly error for syntax issues
        return res.json({
          answer: `I'm having trouble processing that question in a way that works with our database. 🤔

**Could you try rephrasing it?** Here are some tips:

• **Break it down**: Instead of one complex question, try asking in parts
• **Be specific**: "top 3 products per distributor" is clearer than "best products"
• **Use clear phrases**: "for each distributor" or "per distributor" helps me understand
• **Specify criteria**: "by sales amount" or "by quantity"

**Example improvements:**
• Instead of: "top distributors and their products"
• Try: "Show me top 10 distributors by sales, then show top 3 products for each"

Feel free to ask again with a clearer question!`,
          rowCount: 0,
          type: 'query_complexity_error'
        });
      }
      
      // Generic database error - friendly message
      return res.json({
        answer: `I couldn't find the data you're looking for. 😕

This might be because:
• The data doesn't exist for the criteria you specified
• The time period might be outside our available data range
• There might be a temporary issue

**Here's what you can try:**
• Use a different time period (e.g., "last 6 months" instead of "last year")
• Be more specific about what you want (e.g., "top 10 distributors" instead of "distributors")
• Check if product or distributor names are spelled correctly

**Example questions that usually work:**
• "Show me top 10 distributors by sales in the last 6 months"
• "What are the best-selling products this year?"
• "List all distributors and their total sales"`,
        rowCount: 0,
        type: 'database_error'
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
      // Fallback: NEVER show raw JSON - always format in natural language
      // Try to format the data in a readable way
      let formattedData = `## 📊 Query Results\n\nI found ${rowCount} record${rowCount !== 1 ? 's' : ''}.\n\n`;
      
      if (rowCount > 0) {
        formattedData += `**Summary:**\n\n`;
        // Try to format first few rows in a readable way
        const sampleRows = rows.slice(0, 10);
        sampleRows.forEach((row, idx) => {
          const keys = Object.keys(row);
          if (keys.length > 0) {
            formattedData += `${idx + 1}. `;
            keys.forEach((key, keyIdx) => {
              const value = row[key];
              formattedData += `**${key}**: ${value}`;
              if (keyIdx < keys.length - 1) formattedData += ' | ';
            });
            formattedData += '\n';
          }
        });
        if (rowCount > 10) {
          formattedData += `\n*(Showing first 10 of ${rowCount} results)*`;
        }
      }
      
      return res.json({
        answer: formattedData,
        rowCount,
        type: 'fallback',
        sql: sql // Always include SQL for transparency
      });
    }

    // Extract table information for context tracking
    const tableUsed = extractTableFromSql(sql);
    
    // Detect if user asked for charts/graphs
    const lowerQuestion = question.toLowerCase();
    const wantsChart = /(chart|graph|plot|visualize|visualization|bar chart|line chart|pie chart|show.*graph|show.*chart|display.*graph|display.*chart|visual|diagram)/i.test(lowerQuestion);
    
    // Determine chart type and prepare data
    let chartData = null;
    let chartType = null;
    
    // Always try to generate charts if user asks, or if data is suitable for visualization
    const shouldGenerateChart = wantsChart || (rowCount > 0 && rowCount <= 50 && rowCount > 1);
    
    if (shouldGenerateChart && rowCount > 0 && rowCount <= 100) {
      // Analyze data structure to determine best chart type
      const firstRow = rows[0];
      const keys = Object.keys(firstRow);
      
      // Check for time-series data (Year, Month, Date, etc.)
      const timeKey = keys.find(k => /year|month|date|day|week|quarter|time/i.test(k));
      const hasTimeDimension = !!timeKey;
      
      // Check for numeric values (sales, amount, quantity, etc.)
      const numericKeys = keys.filter(k => {
        if (k === timeKey) return false;
        const val = firstRow[k];
        if (typeof val === 'number') return true;
        if (typeof val === 'string') {
          const num = parseFloat(val);
          return !isNaN(num) && isFinite(num);
        }
        return false;
      });
      
      // Check for categorical data (distributor names, product names, etc.)
      const categoricalKeys = keys.filter(k => {
        if (k === timeKey || numericKeys.includes(k)) return false;
        const val = firstRow[k];
        return typeof val === 'string' && val.length < 100; // Reasonable length
      });
      
      // Determine chart type based on user preference or data structure
      let preferredChartType = null;
      if (/(line|trend|over time|time series)/i.test(lowerQuestion)) {
        preferredChartType = 'line';
      } else if (/(pie|percentage|share|distribution)/i.test(lowerQuestion)) {
        preferredChartType = 'pie';
      } else if (/(bar|column)/i.test(lowerQuestion)) {
        preferredChartType = 'bar';
      }
      
      if (hasTimeDimension && numericKeys.length > 0) {
        // Time series - use line chart
        chartType = preferredChartType || 'line';
        const timeKeyName = timeKey;
        chartData = {
          type: chartType,
          data: rows.map(row => {
            const dataPoint = {};
            // Add time dimension
            if (timeKeyName) {
              const timeVal = row[timeKeyName];
              // Format time value
              if (typeof timeVal === 'number' && timeVal > 100000) {
                // Likely a date key (YYYYMMDD)
                const dateStr = String(timeVal);
                if (dateStr.length === 8) {
                  dataPoint.x = `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
                } else {
                  dataPoint.x = timeVal;
                }
              } else {
                dataPoint.x = timeVal;
              }
            }
            // Add numeric values
            numericKeys.forEach(key => {
              const val = row[key];
              dataPoint[key] = typeof val === 'number' ? val : parseFloat(val) || 0;
            });
            return dataPoint;
          }),
          xAxis: timeKeyName || 'x',
          yAxis: numericKeys[0] || 'value'
        };
      } else if (categoricalKeys.length > 0 && numericKeys.length > 0) {
        // Categorical data - use bar chart (or pie if small dataset)
        chartType = preferredChartType || (rowCount <= 10 ? 'pie' : 'bar');
        const categoryKey = categoricalKeys[0];
        chartData = {
          type: chartType,
          data: rows.slice(0, 30).map(row => {
            const dataPoint = {};
            // Add category name
            if (categoryKey) {
              const catVal = String(row[categoryKey]);
              dataPoint.name = catVal.length > 40 ? catVal.substring(0, 37) + '...' : catVal;
            } else {
              dataPoint.name = 'Item';
            }
            // Add numeric values
            numericKeys.forEach(key => {
              const val = row[key];
              dataPoint.value = typeof val === 'number' ? val : parseFloat(val) || 0;
              dataPoint[key] = typeof val === 'number' ? val : parseFloat(val) || 0;
            });
            return dataPoint;
          }),
          xAxis: categoryKey || 'name',
          yAxis: numericKeys[0] || 'value'
        };
      } else if (numericKeys.length >= 2) {
        // Multiple numeric values - use bar chart
        chartType = preferredChartType || 'bar';
        chartData = {
          type: chartType,
          data: rows.slice(0, 30).map((row, idx) => {
            const dataPoint = { name: `Item ${idx + 1}` };
            numericKeys.forEach(key => {
              const val = row[key];
              dataPoint[key] = typeof val === 'number' ? val : parseFloat(val) || 0;
            });
            return dataPoint;
          }),
          xAxis: 'name',
          yAxis: numericKeys[0]
        };
      } else if (numericKeys.length === 1 && rowCount <= 20) {
        // Single numeric value, small dataset - use bar chart
        chartType = preferredChartType || 'bar';
        chartData = {
          type: chartType,
          data: rows.map((row, idx) => {
            const val = row[numericKeys[0]];
            return {
              name: `Item ${idx + 1}`,
              value: typeof val === 'number' ? val : parseFloat(val) || 0,
              [numericKeys[0]]: typeof val === 'number' ? val : parseFloat(val) || 0
            };
          }),
          xAxis: 'name',
          yAxis: numericKeys[0] || 'value'
        };
      }
    }

    res.json({
      answer,
      rowCount,
      type: 'success',
      sql: sql, // Always include full SQL for user visibility
      table: tableUsed, // Track which table was used for follow-up questions
      chartData: chartData, // Include chart data if applicable
      chartType: chartType, // Chart type
      rawData: wantsChart ? rows.slice(0, 100) : undefined // Include raw data for charting
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'An unexpected error occurred',
      message: `I encountered an unexpected error while processing your request. Please try again in a moment.

If the problem persists, try rephrasing your question or breaking it into smaller parts.`
    });
  }
});

export default router;
