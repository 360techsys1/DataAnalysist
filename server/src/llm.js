import dotenv from 'dotenv';
import { schemaDescription } from './schemaConfig.js';
import { callLLM } from './llmProvider.js';

dotenv.config();

// Detect if message is conversational (not a data query)
export function isConversationalMessage(message, history = []) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Explicit conversational patterns (must be caught)
  const explicitConversational = [
    /^who are you/i,
    /^what are you/i,
    /^tell me about yourself/i,
    /^what can you do/i,
    /^help/i,
    /^(hi|hello|hey|greetings?|good\s(morning|afternoon|evening))/i,
    /^(wow|cool|nice|great|awesome|amazing|interesting|thanks|thank you)/i,
    /^(that's|that is|this is|it's|it is) (crazy|cool|nice|great|awesome|amazing|interesting)/i,
    /^(ok|okay|alright|sure|yeah|yes|no|nope)(\s|$)/i,
    /^(i (think|believe|guess)|sounds good|makes sense)/i,
    /(do you have|can you give|tell me|what are|how can|how should).*(suggest|tip|advice|help|improve|better|correct)/i,
    /(suggest|suggestion|tip|advice|help|improve|better way|correct way|how to ask)/i,
  ];
  
  // Check explicit patterns first
  for (const pattern of explicitConversational) {
    if (pattern.test(lowerMessage)) {
      return true;
    }
  }
  
  // Very short messages without question words are likely conversational
  if (lowerMessage.length < 15 && !/[?]/.test(lowerMessage)) {
    const hasQueryWords = /\b(show|list|what|which|how|when|where|who|tell|find|get|give|provide|calculate|analyze|compare|top|best|worst|total|sum|average|count|sales|distributor|product|order|revenue|amount|growth|year|month|data)\b/i.test(lowerMessage);
    if (!hasQueryWords) {
      return true;
    }
  }
  
  return false;
}

// Detect if question is asking about previous query metadata (table used, data source)
export function isMetadataQuestion(question, history = []) {
  const lowerQuestion = question.toLowerCase();
  
  // Patterns that indicate asking about previous query
  const metadataPatterns = [
    /(is|was|were|does|did) (this|that|it|these|those) (from|using|come from|based on)/i,
    /(where|what) (is|was|were|does|did) (this|that|it|these|those) (from|come from)/i,
    /(is|was|were) (this|that|it) (primary|secondary|primary sales|secondary sales)/i,
    /(which|what) (table|data|source|database|dataset) (is|was|were|does|did)/i,
    /(does|did) (this|that|it) (use|come from|include)/i,
    /^(this|that|it) (is|was|were|comes|come) from/i,
  ];
  
  // Check if it matches metadata patterns AND has context from history
  if (history.length > 0 && metadataPatterns.some(pattern => pattern.test(question))) {
    return true;
  }
  
  return false;
}

// Extract table name from SQL query
export function extractTableFromSql(sql) {
  const sqlUpper = sql.toUpperCase();
  
  if (sqlUpper.includes('FACT_SALES_ORDER')) {
    return 'primary';
  } else if (sqlUpper.includes('FACT_SECONDARY_SALES')) {
    return 'secondary';
  } else if (sqlUpper.includes('DIMPRODUCT')) {
    return 'product';
  } else if (sqlUpper.includes('DIMDISTRIBUTION')) {
    return 'distributor';
  }
  
  return 'unknown';
}

// Extract entities (distributors, products) from previous conversation results
export function extractEntitiesFromHistory(history = []) {
  const entities = {
    distributors: [],
    products: [],
    timePeriod: null,
    lastQueryType: null
  };
  
  // Look at the last assistant message that had data
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === 'assistant' && msg.content) {
      const content = msg.content;
      
      // Try multiple patterns to extract distributor names
      // Pattern 1: Numbered list with PKR (e.g., "1. PRESTIGE GROUP: PKR 468,670,997.09")
      const numberedPattern = /\d+\.\s+([A-Z][A-Z\s&()\-.,]+?):\s*PKR/g;
      let matches = content.match(numberedPattern);
      if (matches && matches.length > 0) {
        entities.distributors = matches.map(match => {
          const name = match.replace(/^\d+\.\s+/, '').replace(/:\s*PKR.*$/, '').trim();
          return name;
        }).filter(name => name.length > 0 && name.length < 100); // Reasonable length filter
        if (entities.distributors.length > 0) {
          entities.lastQueryType = 'distributors';
          break;
        }
      }
      
      // Pattern 2: Markdown bold with PKR (e.g., "**PRESTIGE GROUP**: PKR 468,670,997.09")
      const markdownPattern = /\*\*([A-Z][A-Z\s&()\-.,]+?)\*\*:?\s*PKR/g;
      matches = content.match(markdownPattern);
      if (matches && matches.length > 0) {
        entities.distributors = matches.map(match => {
          const name = match.replace(/\*\*/g, '').replace(/:\s*PKR.*$/, '').trim();
          return name;
        }).filter(name => name.length > 0 && name.length < 100);
        if (entities.distributors.length > 0) {
          entities.lastQueryType = 'distributors';
          break;
        }
      }
      
      // Pattern 3: Bullet points with PKR (e.g., "• **PRESTIGE GROUP**: PKR 468,670,997.09")
      const bulletPattern = /[•\*]\s+\*\*([A-Z][A-Z\s&()\-.,]+?)\*\*:?\s*PKR/g;
      matches = content.match(bulletPattern);
      if (matches && matches.length > 0) {
        entities.distributors = matches.map(match => {
          const name = match.replace(/^[•\*]\s+\*\*/, '').replace(/\*\*:?\s*PKR.*$/, '').trim();
          return name;
        }).filter(name => name.length > 0 && name.length < 100);
        if (entities.distributors.length > 0) {
          entities.lastQueryType = 'distributors';
          break;
        }
      }
      
      // Pattern 4: Table format or simple list
      const tablePattern = /\|([A-Z][A-Z\s&()\-.,]+?)\|.*PKR/g;
      matches = content.match(tablePattern);
      if (matches && matches.length > 0) {
        entities.distributors = matches.map(match => {
          const name = match.replace(/^\|/, '').replace(/\|.*$/, '').trim();
          return name;
        }).filter(name => name.length > 0 && name.length < 100);
        if (entities.distributors.length > 0) {
          entities.lastQueryType = 'distributors';
          break;
        }
      }
    }
  }
  
  return entities;
}

// Check if user is asking about previous results (e.g., "each of these distributors")
export function isFollowUpQuestion(question, history = []) {
  const lowerQuestion = question.toLowerCase();
  
  const followUpPatterns = [
    /(each|every|all) of (these|those|the above|the previous|the last)/i,
    /(these|those|the above|the previous|the last) (distributors?|products?|items?)/i,
    /(for|of) (each|every) (of )?(these|those|the above|the previous|the last)/i,
    /(best|top|worst) (selling|performing) (product|item) (of|for|in) (each|every) (of )?(these|those|the above)/i,
  ];
  
  return followUpPatterns.some(pattern => pattern.test(question)) && history.length > 0;
}

// Handle metadata questions about previous queries
export async function handleMetadataQuestion(question, history = [], lastSql = null, lastTable = null) {
  const lowerQuestion = question.toLowerCase();
  
  // Determine what table was used in previous query
  let tableUsed = lastTable;
  let tableDescription = '';
  
  if (tableUsed === 'primary' || (!tableUsed && lastSql && lastSql.toUpperCase().includes('FACT_SALES_ORDER'))) {
    tableUsed = 'primary';
    tableDescription = '**Primary Sales** (FACT_SALES_ORDER) - These are orders directly to distributors from your company.';
  } else if (tableUsed === 'secondary' || (!tableUsed && lastSql && lastSql.toUpperCase().includes('FACT_SECONDARY_SALES'))) {
    tableUsed = 'secondary';
    tableDescription = '**Secondary Sales** (FACT_SECONDARY_SALES) - These are market sales from distributors to end customers.';
  } else if (lastSql) {
    // Try to infer from SQL
    tableUsed = extractTableFromSql(lastSql);
    if (tableUsed === 'primary') {
      tableDescription = '**Primary Sales** (FACT_SALES_ORDER) - These are orders directly to distributors from your company.';
    } else if (tableUsed === 'secondary') {
      tableDescription = '**Secondary Sales** (FACT_SECONDARY_SALES) - These are market sales from distributors to end customers.';
    }
  }
  
  // Check if asking about primary/secondary specifically
  const askingAboutPrimary = /\b(primary|primary sales)\b/i.test(question);
  const askingAboutSecondary = /\b(secondary|secondary sales)\b/i.test(question);
  
  if (askingAboutPrimary || askingAboutSecondary) {
    if (tableUsed === 'primary' && askingAboutPrimary) {
      return `Yes, the data I just showed you was from **Primary Sales** (FACT_SALES_ORDER table).

${tableDescription}

Primary sales represent orders that your company receives directly from distributors. If you'd like to see **Secondary Sales** data instead (sales from distributors to end customers), I can fetch that for you. Just ask!`;
    } else if (tableUsed === 'secondary' && askingAboutSecondary) {
      return `Yes, the data I just showed you was from **Secondary Sales** (FACT_SECONDARY_SALES table).

${tableDescription}

Secondary sales represent sales from distributors to end customers in the market. If you'd like to see **Primary Sales** data instead (orders to distributors), I can fetch that for you. Just ask!`;
    } else if (tableUsed === 'primary' && askingAboutSecondary) {
      return `No, the data I just showed you was from **Primary Sales** (FACT_SALES_ORDER), not secondary sales.

**Primary Sales** are orders directly to distributors from your company.

Would you like me to show you **Secondary Sales** data instead? Secondary sales represent sales from distributors to end customers.`;
    } else if (tableUsed === 'secondary' && askingAboutPrimary) {
      return `No, the data I just showed you was from **Secondary Sales** (FACT_SECONDARY_SALES), not primary sales.

**Secondary Sales** are sales from distributors to end customers in the market.

Would you like me to show you **Primary Sales** data instead? Primary sales represent orders directly to distributors from your company.`;
    }
  }
  
  // Generic response about data source
  if (tableUsed === 'primary') {
    return `The data I just showed you was from **Primary Sales** (FACT_SALES_ORDER table).

${tableDescription}

This represents orders that your company receives directly from distributors. If you'd like to compare with **Secondary Sales** (sales from distributors to end customers), I can fetch that data for you.`;
  } else if (tableUsed === 'secondary') {
    return `The data I just showed you was from **Secondary Sales** (FACT_SECONDARY_SALES table).

${tableDescription}

This represents sales from distributors to end customers in the market. If you'd like to compare with **Primary Sales** (orders to distributors), I can fetch that data for you.`;
  }
  
  // Fallback - use LLM to understand context
  const systemPrompt = `You are a helpful assistant for Hilal Foods. The user is asking about the previous query/data they received. 

Based on the conversation history, determine what data source was used (primary sales or secondary sales) and explain it clearly.

If the previous query used FACT_SALES_ORDER, it's PRIMARY SALES.
If the previous query used FACT_SECONDARY_SALES, it's SECONDARY SALES.

Be clear and helpful.`;

  const contextPrompt = `User asked: "${question}"

Previous conversation:
${history.slice(-2).map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 200)}`).join('\n')}

${lastSql ? `Previous SQL used: ${lastSql.substring(0, 200)}...` : ''}

Explain what data source was used in the previous answer.`;

  try {
    const response = await callLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contextPrompt }
    ], {
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.content;
  } catch (error) {
    console.error('Error handling metadata question:', error);
    return 'I used data from our sales database. Could you clarify what specific information you\'d like to know about the data source?';
  }
}

// Handle conversational messages
export async function handleConversationalMessage(message, history = []) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Handle specific questions
  if (/who are you|what are you|tell me about yourself/i.test(lowerMessage)) {
    return `I'm the **Hilal Foods Data Analysis Assistant**! 👋

I'm an AI-powered business intelligence tool designed to help you analyze your company's data. I can answer questions about:

📊 **Sales** - Primary and secondary sales, revenue trends, growth analysis
🏭 **Distributors** - Performance, rankings, regional analysis
📦 **Products** - Best sellers, product comparisons, inventory insights
📈 **Business Metrics** - Year-over-year growth, monthly trends, forecasting

Just ask me questions in natural language like:
• "Show me top 10 distributors by sales"
• "What was our year-over-year growth?"
• "Compare sales between 2022 and 2023"

How can I help you analyze your business data today?`;
  }
  
  if (/what can you do|help/i.test(lowerMessage)) {
    return `I can help you with various business analytics! Here's what I can do:

📊 **Sales Analysis**
• Total sales by time period
• Year-over-year growth
• Month-wise breakdowns
• Regional sales performance

🏭 **Distributor Insights**
• Top performing distributors
• Distributor rankings
• Sales by distributor
• Regional distributor analysis

📦 **Product Analytics**
• Best-selling products
• Product comparisons
• Category performance
• Sales by product

📈 **Business Intelligence**
• Growth trends
• Time-series analysis
• Forecasting insights
• Performance comparisons

**Just ask me in natural language!** For example:
• "Show me primary sales month-wise for the past 3 years"
• "What are the top 10 distributors by sales?"
• "Compare our sales growth year over year"`;
  }
  
  const systemPrompt = `You are a friendly Business Intelligence Assistant for Hilal Foods, a food company based in Karachi, Pakistan. You help users understand their business data.

When users make conversational comments (like "wow that's interesting", "thanks", "ok"), respond naturally and helpfully. You can:
- Acknowledge their comment
- Offer to help with related questions
- Suggest follow-up analysis they might find useful
- Be concise and friendly

Keep responses brief (1-2 sentences) and professional.`;

  const recentContext = history.slice(-2).map(msg => 
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 150)}`
  ).join('\n');

  const userPrompt = recentContext 
    ? `Recent conversation:\n${recentContext}\n\nUser now says: "${message}"\n\nRespond conversationally and helpfully.`
    : `User says: "${message}"\n\nRespond conversationally and helpfully.`;

  try {
    const response = await callLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.7,
      max_tokens: 150,
    });

    return response.content;
  } catch (error) {
    console.error('LLM API error (conversational):', error);
    return "I'm here to help! Feel free to ask me any questions about your sales, distributors, or products.";
  }
}

// SQL Safety Check - Only allow SELECT queries
export function isSqlSafe(sql) {
  const sqlTrimmed = sql.trim();
  const sqlUpper = sqlTrimmed.toUpperCase();
  
  // Must start with SELECT or WITH (for CTEs)
  if (!sqlUpper.startsWith('SELECT') && !sqlUpper.startsWith('WITH')) {
    return false;
  }
  
  // Block dangerous operations (use word boundaries to avoid false positives)
  const dangerous = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE',
    'TRUNCATE', 'EXEC', 'EXECUTE', 'SP_EXECUTESQL', 'XP_',
    'GRANT', 'REVOKE', 'MERGE', 'BULK INSERT'
  ];
  
  for (const keyword of dangerous) {
    // Use word boundaries to avoid false positives
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(sqlUpper)) {
      return false;
    }
  }
  
  // Allow semicolon only at the end (trim it first)
  // Block semicolons in the middle (prevent injection/chaining)
  const sqlWithoutTrailingSemicolon = sqlTrimmed.replace(/;\s*$/, '');
  if (sqlWithoutTrailingSemicolon.includes(';')) {
    return false;
  }
  
  return true;
}

// Intelligently rephrase user question when SQL generation fails - CONTEXT-AWARE
export async function suggestRephrasedQuestion(originalQuestion, errorType = 'SQL_GENERATION_FAILED', history = [], entities = null) {
  try {
    // Build context from history
    const recentContext = history.slice(-3).map(msg => {
      if (msg.role === 'user') {
        return `User asked: ${msg.content}`;
      } else {
        // Extract key info from assistant response
        const content = msg.content.substring(0, 300);
        return `Assistant responded: ${content}`;
      }
    }).join('\n\n');
    
  const entitiesContext = (entities && entities.distributors && Array.isArray(entities.distributors) && entities.distributors.length > 0)
    ? `\n\nIMPORTANT CONTEXT: The user previously asked about these distributors: ${entities.distributors.slice(0, 10).join(', ')}. When they say "each of these distributors" or "these distributors", they mean these specific ones.`
    : '';
    
    const systemPrompt = `You are a helpful assistant that improves user questions for database queries. When a user's question fails to generate a proper SQL query, you should suggest a clearer, more specific version that maintains their intent.

CRITICAL: Use the conversation context to understand what the user is referring to. If they mention "these distributors" or "each of these", they're referring to distributors from a previous query.

Rules:
1. Understand what the user is trying to ask based on conversation context
2. If they mention "these distributors/products", suggest a question that explicitly references the context
3. Suggest a rephrased version that's clearer and more specific
4. Keep the intent the same but make it more query-friendly
5. Fix typos (like "oast" -> "past", "sles" -> "sales")
6. Be friendly and helpful
7. Return ONLY the suggested question, no explanations, no markdown

Examples:
- User asked about "top 10 distributors" and now says "best product of each" -> "Show me the top 3 best-selling products for each of the top 10 distributors from the previous query"
- "Show company year to year growth over the oast 3 years" -> "Show company year-over-year sales growth for the past 3 years (2022, 2023, 2024)"
- "sales data" -> "Show me total sales by year for the last 3 years"
- "top stuff" -> "Show me the top 10 distributors by total sales"`;

    const userPrompt = `The user asked: "${originalQuestion}"

This question failed to generate a proper database query (${errorType}).${entitiesContext}

Recent conversation context:
${recentContext || 'No previous context'}

Suggest a clearer, more specific rephrased version of this question that would work better for database queries. If the user is referring to previous results (like "these distributors"), make sure your suggestion explicitly references that context.

Focus on:
- Being specific about time periods
- Clarifying what data they want (sales, distributors, products)
- Using standard business terminology
- Fixing any typos
- If they mention "each of these", suggest a question that clearly references the previous results

Return ONLY the rephrased question, nothing else.`;

    const response = await callLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.7,
      max_tokens: 200,
    });

    const suggested = response.content.trim().replace(/^["']|["']$/g, '');
    return suggested || null;
  } catch (error) {
    console.error('Error generating rephrased question:', error);
    // Return null instead of throwing - let the caller handle it
    return null;
  }
}

// Generate SQL from user question
export async function generateSqlFromQuestion(question, history = []) {
  // Get current date for context
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
  const currentDay = now.getDate();
  const currentDateKey = parseInt(`${currentYear}${String(currentMonth).padStart(2, '0')}${String(currentDay).padStart(2, '0')}`);
  
  // Calculate common date ranges based on current date
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const lastMonthDateKey = parseInt(`${lastMonthYear}${String(lastMonth).padStart(2, '0')}01`);
  const lastMonthEndDateKey = parseInt(`${lastMonthYear}${String(lastMonth).padStart(2, '0')}31`);
  
  // Last 3 months (the 3 months before current month, not including current month)
  // Example: If current is December 2025, last 3 months = September, October, November 2025
  let threeMonthsAgoMonth, threeMonthsAgoYear;
  if (currentMonth >= 4) {
    // Current month is April or later, go back 3 months in same year
    threeMonthsAgoMonth = currentMonth - 3;
    threeMonthsAgoYear = currentYear;
  } else {
    // Current month is Jan, Feb, or Mar, need to go to previous year
    threeMonthsAgoMonth = currentMonth + 9; // e.g., Jan(1) -> Oct(10) of previous year
    threeMonthsAgoYear = currentYear - 1;
  }
  const threeMonthsAgoDateKey = parseInt(`${threeMonthsAgoYear}${String(threeMonthsAgoMonth).padStart(2, '0')}01`);
  
  // End date is last day of the month before current month
  const lastMonthEndDateKeyForThreeMonths = parseInt(`${lastMonthYear}${String(lastMonth).padStart(2, '0')}31`);
  
  // Current year start and end
  const currentYearStart = parseInt(`${currentYear}0101`);
  const currentYearEnd = parseInt(`${currentYear}1231`);
  
  // Previous year
  const prevYearStart = parseInt(`${currentYear - 1}0101`);
  const prevYearEnd = parseInt(`${currentYear - 1}1231`);
  
  // Last 3 years (including current)
  const threeYearsAgoStart = parseInt(`${currentYear - 2}0101`);
  
  const systemPrompt = `You are an expert SQL query generator for Hilal Foods database. Generate SAFE, READ-ONLY SQL SELECT queries based on user questions.

CRITICAL DATE CONTEXT - USE CURRENT DATE FOR RELATIVE QUERIES:
**CURRENT DATE: ${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')} (DATEKEY: ${currentDateKey})**
**CURRENT YEAR: ${currentYear}**

IMPORTANT - When user says:
- "last month" = ${lastMonthYear}-${String(lastMonth).padStart(2, '0')} (DATEKEY >= ${lastMonthDateKey} AND DATEKEY <= ${lastMonthEndDateKey})
- "last 3 months" = ${threeMonthsAgoYear}-${String(threeMonthsAgoMonth).padStart(2, '0')} to ${lastMonthYear}-${String(lastMonth).padStart(2, '0')} (DATEKEY >= ${threeMonthsAgoDateKey} AND DATEKEY <= ${lastMonthEndDateKey}) - Example: If current is December 2025, this means September-October-November 2025
- "this year" = ${currentYear} (DATEKEY >= ${currentYearStart} AND DATEKEY <= ${currentYearEnd})
- "last year" = ${currentYear - 1} (DATEKEY >= ${prevYearStart} AND DATEKEY <= ${prevYearEnd})
- "past 3 years" = ${currentYear - 2}, ${currentYear - 1}, ${currentYear} (DATEKEY >= ${threeYearsAgoStart} AND DATEKEY <= ${currentYearEnd})

CRITICAL RULES:
1. ONLY generate SELECT or WITH (CTE) queries - NEVER INSERT, UPDATE, DELETE, DROP, ALTER, etc.
2. Always use proper JOINs to get readable names (distributor names, product names)
3. DATEKEY format: INTEGER YYYYMMDD (20240101 = Jan 1, 2024)
4. For date ranges: DATEKEY >= start AND DATEKEY <= end
5. To extract year: CAST(DATEKEY/10000 AS INT) or DATEKEY/10000
6. To extract month: CAST((DATEKEY % 10000)/100 AS INT) or (DATEKEY % 10000)/100
7. For month-wise grouping: GROUP BY CAST(DATEKEY/10000 AS INT), CAST((DATEKEY % 10000)/100 AS INT)
8. For year-wise grouping: GROUP BY CAST(DATEKEY/10000 AS INT)
9. Always use NET_AMOUNT for sales calculations
10. Use aggregations: SUM(), COUNT(), AVG(), MAX(), MIN()
11. Use TOP N for limiting results
12. Return ONLY the SQL query, no explanations, no markdown code blocks, just pure SQL
13. For primary sales, use FACT_SALES_ORDER table
14. For secondary sales, use FACT_SECONDARY_SALES table
15. Always use INNER JOIN for fact tables
16. ALWAYS use CURRENT YEAR (${currentYear}) for relative date queries like "last month", "this year", "last 3 months"
17. "year to year" or "year-over-year" means compare totals by year
18. If question doesn't specify primary/secondary, default to FACT_SALES_ORDER (primary sales)
19. NEVER use old years (like 2023) for "last month" or "last 3 months" - always use ${currentYear} for current period
20. **CRITICAL SQL SERVER LIMITATION - ORDER BY IN CTEs**: 
   - WRONG: WITH MyCTE AS (SELECT col FROM table ORDER BY col) -- THIS WILL FAIL! ORDER BY alone is not allowed in CTEs.
   - WRONG: WITH MyCTE AS (SELECT col, SUM(amount) FROM table GROUP BY col ORDER BY SUM(amount)) -- THIS WILL FAIL!
   - CORRECT: WITH MyCTE AS (SELECT TOP 3 col FROM table ORDER BY col) -- ORDER BY is allowed WITH TOP
   - CORRECT: WITH MyCTE AS (SELECT col, ROW_NUMBER() OVER (ORDER BY col) AS rn FROM table) -- ORDER BY inside window function is allowed
   - CORRECT: WITH MyCTE AS (SELECT col FROM table), Final AS (SELECT * FROM MyCTE ORDER BY col) -- ORDER BY in final SELECT is allowed
   
21. For ranking/sorting in CTEs: 
   - If you need to rank/sort in a CTE, use ROW_NUMBER() window function: ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) 
   - ORDER BY inside OVER() clause is allowed, but ORDER BY at CTE level without TOP is NOT allowed
   - Filter rankings in final SELECT: WHERE rn <= N
   
22. **NEVER write ORDER BY at CTE level without TOP**: 
   - WRONG: WITH CTE AS (SELECT col FROM table GROUP BY col ORDER BY SUM(amount)) 
   - CORRECT: WITH CTE AS (SELECT col, SUM(amount) AS total FROM table GROUP BY col), Final AS (SELECT * FROM CTE ORDER BY total)

${schemaDescription}

COMPREHENSIVE EXAMPLES:

1. Top 10 distributors by total sales (all time):
SELECT TOP 10 d.NAME, SUM(f.NET_AMOUNT) AS TotalSales
FROM FACT_SALES_ORDER f
INNER JOIN DIMDISTRIBUTION_MASTER d ON f.DISTKEY = d.DISTKEY
GROUP BY d.NAME
ORDER BY TotalSales DESC

2. Primary sales month-wise for 2022-2024:
SELECT CAST(DATEKEY/10000 AS INT) AS Year, CAST((DATEKEY % 10000)/100 AS INT) AS Month, SUM(NET_AMOUNT) AS TotalSales
FROM FACT_SALES_ORDER
WHERE DATEKEY >= 20220101 AND DATEKEY <= 20241231
GROUP BY CAST(DATEKEY/10000 AS INT), CAST((DATEKEY % 10000)/100 AS INT)
ORDER BY Year, Month

3. Year-over-year growth (sales by year):
SELECT CAST(DATEKEY/10000 AS INT) AS Year, SUM(NET_AMOUNT) AS TotalSales
FROM FACT_SALES_ORDER
WHERE DATEKEY >= 20220101 AND DATEKEY <= 20241231
GROUP BY CAST(DATEKEY/10000 AS INT)
ORDER BY Year

4. Sales for past 3 years (2022-2024):
SELECT CAST(DATEKEY/10000 AS INT) AS Year, SUM(NET_AMOUNT) AS TotalSales
FROM FACT_SALES_ORDER
WHERE DATEKEY >= 20220101 AND DATEKEY <= 20241231
GROUP BY CAST(DATEKEY/10000 AS INT)
ORDER BY Year

5. Best selling products:
SELECT TOP 10 p.PRODUCTDESCRIPTION, SUM(f.NET_AMOUNT) AS TotalSales, SUM(f.QUANTITY) AS TotalQuantity
FROM FACT_SALES_ORDER f
INNER JOIN DIMPRODUCT p ON f.PRODUCTKEY = p.PRODUCTKEY
GROUP BY p.PRODUCTDESCRIPTION
ORDER BY TotalSales DESC

6. Sales by region:
SELECT dl.REGION, SUM(f.NET_AMOUNT) AS TotalSales
FROM FACT_SALES_ORDER f
INNER JOIN DIMDISTRIBUTION_LOCATION dl ON f.DIST_LOCKEY = dl.DIST_LOCKEY
GROUP BY dl.REGION
ORDER BY TotalSales DESC

7. Top distributors with their top products (CORRECT - using ROW_NUMBER, NO ORDER BY in CTEs):
WITH DistributorSales AS (
    SELECT TOP 3
        d.DISTKEY,
        d.NAME,
        SUM(f.NET_AMOUNT) AS TotalSales
    FROM FACT_SALES_ORDER f
    INNER JOIN DIMDISTRIBUTION_MASTER d ON f.DISTKEY = d.DISTKEY
    GROUP BY d.DISTKEY, d.NAME
),
TopDistributors AS (
    SELECT DISTKEY, NAME, TotalSales
    FROM DistributorSales
),
ProductRanked AS (
    SELECT
        f.DISTKEY,
        p.PRODUCTDESCRIPTION,
        SUM(f.NET_AMOUNT) AS ProductSales,
        ROW_NUMBER() OVER (PARTITION BY f.DISTKEY ORDER BY SUM(f.NET_AMOUNT) DESC) AS Rank
    FROM FACT_SALES_ORDER f
    INNER JOIN DIMPRODUCT p ON f.PRODUCTKEY = p.PRODUCTKEY
    WHERE f.DISTKEY IN (SELECT DISTKEY FROM TopDistributors)
    GROUP BY f.DISTKEY, p.PRODUCTDESCRIPTION
)
SELECT
    td.NAME AS DistributorName,
    pr.PRODUCTDESCRIPTION AS ProductName,
    pr.ProductSales AS Sales
FROM TopDistributors td
INNER JOIN ProductRanked pr ON td.DISTKEY = pr.DISTKEY
WHERE pr.Rank <= 2
ORDER BY td.TotalSales DESC, pr.ProductSales DESC

Remember:
- "primary sales" or "company sales" = FACT_SALES_ORDER
- "secondary sales" = FACT_SECONDARY_SALES  
- If not specified, default to FACT_SALES_ORDER (primary sales)
- For growth analysis, compare years using DATEKEY/10000
- For month-wise, group by both year and month
- Always extract dates properly: Year = DATEKEY/10000, Month = (DATEKEY % 10000)/100
- CURRENT YEAR IS ${currentYear} - always use ${currentYear} for relative queries like "last month", "this year", "last 3 months"
- "past 3 years" = ${currentYear - 2}, ${currentYear - 1}, ${currentYear} (DATEKEY >= ${threeYearsAgoStart} AND DATEKEY <= ${currentYearEnd})
- "last month" = ${lastMonthYear}-${String(lastMonth).padStart(2, '0')} (DATEKEY >= ${lastMonthDateKey} AND DATEKEY <= ${lastMonthEndDateKey})
- "last 3 months" = ${threeMonthsAgoYear}-${String(threeMonthsAgoMonth).padStart(2, '0')} to ${lastMonthYear}-${String(lastMonth).padStart(2, '0')} (DATEKEY >= ${threeMonthsAgoDateKey} AND DATEKEY <= ${lastMonthEndDateKey}) - Example: If current is December 2025, this means September-October-November 2025
- NEVER use old years when user asks for "last month" or "last 3 months" - always use current year ${currentYear}

Now generate SQL for: "${question}"`;

  // Extract entities from history for better context
  const entities = extractEntitiesFromHistory(history);
  let contextEnhancement = '';
  
  if (entities.distributors.length > 0 && /(these|those|each|every|above|previous)/i.test(question)) {
    contextEnhancement = `\n\nIMPORTANT CONTEXT: The user previously asked about these distributors: ${entities.distributors.slice(0, 10).join(', ')}. When they say "each of these distributors" or "these distributors", they mean these specific distributors. You should filter by these distributor names in your query.`;
  }
  
  const messages = [
    { role: 'system', content: systemPrompt + contextEnhancement },
    ...history.slice(-4).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.role === 'user' 
        ? `Previous question: ${msg.content}` 
        : `Previous response summary: ${msg.content.substring(0, 500)}${msg.sql ? `\n\nPrevious SQL used: ${msg.sql.substring(0, 200)}` : ''}`
    })),
    { role: 'user', content: question }
  ];

  try {
    const response = await callLLM(messages, {
      temperature: 0.2, // Lower temperature for more consistent SQL
      max_tokens: 1500, // Increased for complex queries with CTEs
    });

    let sql = response.content.trim();
    
    // Clean up SQL (remove markdown code blocks if present)
    sql = sql.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();
    
    // Remove any leading/trailing quotes
    sql = sql.replace(/^["']|["']$/g, '');
    
    // Remove trailing semicolon for safety check (we'll add it back if needed)
    sql = sql.replace(/;\s*$/, '');
    
    // Log the generated SQL for debugging (server-side only)
    console.log('=== GENERATED SQL ===');
    console.log(sql);
    console.log('=== END SQL ===');
    
    if (!isSqlSafe(sql)) {
      console.error('❌ SQL Safety Check Failed. Generated SQL:', sql);
      throw new Error('SQL_SAFETY_CHECK_FAILED');
    }
    
    return sql;
  } catch (error) {
    console.error('LLM API error:', error);
    if (error.message === 'SQL_SAFETY_CHECK_FAILED') {
      throw error; // Re-throw to be handled specifically
    }
    throw new Error(`SQL_GENERATION_FAILED: ${error.message}`);
  }
}

// Generate formatted answer from query results
export async function answerFromData(question, rows, meta) {
  const { sql, rowCount } = meta;
  
  // Determine data source for context
  const dataSource = extractTableFromSql(sql);
  const sourceNote = dataSource === 'primary' 
    ? '\n\n*Note: This data is from **Primary Sales** (FACT_SALES_ORDER) - orders directly to distributors.*'
    : dataSource === 'secondary'
    ? '\n\n*Note: This data is from **Secondary Sales** (FACT_SECONDARY_SALES) - sales from distributors to end customers.*'
    : '';
  
  const systemPrompt = `You are a Business Intelligence Analyst for Hilal Foods, a food company based in Karachi, Pakistan. Your role is to analyze sales and distributor data and present insights in a clear, professional format.

CRITICAL RULES - ZERO HALLUCINATIONS:
1. ONLY use data from the provided query results - NEVER invent or assume numbers
2. If data is missing or insufficient, clearly state what's missing and suggest how to refine the question
3. Format numbers with commas for readability (e.g., 1,234,567.89)
4. Use proper headings, bullet points, and structured formatting
5. Include relevant icons/emojis for visual appeal (📊 for charts, 📈 for growth, 💰 for sales, 🏆 for top performers, 📍 for locations)
6. Use markdown formatting:
   - ## for main headings
   - ### for subheadings
   - **bold** for emphasis
   - • for bullet points
   - Tables when appropriate
7. Present insights clearly with proper spacing
8. If no data found (empty result set), explain why and suggest refinements
9. Always be specific about time periods, products, distributors mentioned
10. Be conversational and helpful in your explanations
11. For time-series data (month-wise, year-wise), present it clearly with proper formatting
12. Always mention if the data is from Primary Sales or Secondary Sales in your response

FORMAT EXAMPLE:
## 📊 Sales Analysis Summary

### Monthly Breakdown
• **January 2024**: PKR 1,234,567
• **February 2024**: PKR 1,456,789

### Key Insights
[Your analysis based on actual data]

---

Format your response for this question: "${question}"

Query returned ${rowCount} rows.${sourceNote}`;

  const userMessage = `Question: ${question}

Query Results (${rowCount} rows):
${JSON.stringify(rows.slice(0, 100), null, 2)}${rowCount > 100 ? '\n\n(Showing first 100 rows of results for processing)' : ''}

CRITICAL INSTRUCTIONS:
1. NEVER show raw JSON data to the user - format everything in natural, readable language
2. Format ALL data in natural, readable language using markdown
3. Use markdown formatting (headings, bullet points, tables, bold text)
4. Present numbers with proper formatting (commas, currency symbols like PKR)
5. Group related data logically (e.g., by distributor, by product, by time period)
6. If there are many rows, summarize key insights and show top/bottom performers
7. Always mention whether this is Primary Sales or Secondary Sales data
8. Make it conversational and easy to understand for non-technical users
9. Use emojis and icons for visual appeal (📊 📈 💰 🏆 📍)
10. Present data in lists, tables, or structured paragraphs - NEVER as code blocks or JSON

Generate a well-formatted, professional business response. Only use the data provided above. Format it beautifully in natural language - never show JSON or code blocks with raw data.`;

  try {
    const response = await callLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], {
      temperature: 0.7,
      max_tokens: 2500,
    });

    return response.content;
  } catch (error) {
    console.error('LLM API error:', error);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}
