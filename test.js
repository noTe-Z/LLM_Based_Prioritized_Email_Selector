// =================
// CODE UNDER TEST
// =================

/**
 * Global configuration object - Add your API key here
 */
const CONFIG = {
  OPENAI_API_KEY: '' // Replace with your actual API key
};

/**
 * Determines if a Gmail message is related to Generative AI topics using GPT-3.5
 * @param {GoogleAppsScript.Gmail.GmailMessage} message - Gmail message object from GmailApp
 * @returns {boolean} isGenAIRelated - True if message is GenAI-related, false otherwise
 */
function isGenAIRelated(message) {
  const subject = message.getSubject();
  const body = message.getPlainBody();
  
  // Prepare content for analysis
  const contentToAnalyze = `Subject: ${subject}\n\nBody: ${body.substring(0, 1000)}`; // Limit body length
  
  // Call GPT-3.5 API
  const response = callGPT35API(contentToAnalyze);
  return response.isGenAIRelated;
}

/**
 * Calls OpenAI GPT-3.5 API to analyze text content for GenAI relevance
 * @param {string} content - Text in format "Subject: [subject]\n\nBody: [body]"
 * @returns {Object} response - Object with format {isGenAIRelated: boolean}
 * @throws {Error} When API call fails, returns {isGenAIRelated: false}
 * @requires {string} CONFIG.OPENAI_API_KEY - OpenAI API key in global CONFIG
 */
function callGPT35API(content) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are an AI that determines if an email is related to Generative AI, LLMs, or AI technology. Respond with only 'true' or 'false'."
      },
      {
        role: "user",
        content: content
      }
    ]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    const answer = json.choices[0].message.content.toLowerCase();
    return { isGenAIRelated: answer === 'true' };
  } catch (error) {
    console.error('Error calling GPT-3.5 API:', error);
    return { isGenAIRelated: false };
  }
}

// =================
// TEST CODE
// =================

/**
 * Mock GmailMessage class to simulate Gmail message objects
 */
class MockGmailMessage {
  constructor(subject, body) {
    this.subject = subject;
    this.body = body;
  }
  
  getSubject() {
    return this.subject;
  }
  
  getPlainBody() {
    return this.body;
  }
}

/**
 * Runs all test cases for the isGenAIRelated function
 * Logs results to console
 */
function testIsGenAIRelated() {
  // Test cases from previous definition
  const testCases = {
    positiveTests: [
      {
        subject: "ChatGPT API Integration Request",
        body: "We need to implement GPT-3.5 into our current workflow...",
        expected: true
      },
      {
        subject: "AI Content Generation Guidelines",
        body: "Please ensure all DALL-E and Midjourney outputs are properly attributed...",
        expected: true
      },
      {
        subject: "Prompt Engineering Position",
        body: "Looking for someone experienced with LLMs and prompt optimization...",
        expected: true
      },
      {
        subject: "License Update",
        body: "Our Claude API usage has exceeded the monthly limit...",
        expected: true
      }
    ],
    negativeTests: [
      {
        subject: "Traditional ML Model Update",
        body: "Updates to our random forest classification model...",
        expected: false
      },
      {
        subject: "General AI Conference",
        body: "Join us for discussions about neural networks and deep learning...",
        expected: false
      },
      {
        subject: "Meeting Notes",
        body: "Here's the summary of yesterday's team sync...",
        expected: false
      }
    ],
    edgeCases: [
      {
        subject: "",
        body: "Something about GPT-4",
        expected: true
      },
      {
        subject: "RE: Re: Fwd: ChatGPT Discussion",
        body: "Yes, let's discuss tomorrow",
        expected: true
      },
      {
        subject: "AI Generated Content",
        body: "The automated report generation system...",
        expected: false
      },
      {
        subject: "GPT",
        body: "GPU temperature monitoring...",
        expected: false
      }
    ]
  };

  // Test results storage
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  // Run all test categories
  Object.entries(testCases).forEach(([category, tests]) => {
    console.log(`\nRunning ${category}...`);
    
    tests.forEach((test, index) => {
      results.total++;
      
      // Create mock message
      const mockMessage = new MockGmailMessage(test.subject, test.body);
      
      try {
        // Run the test
        const result = isGenAIRelated(mockMessage);
        const passed = result === test.expected;
        
        // Store results
        results.passed += passed ? 1 : 0;
        results.failed += passed ? 0 : 1;
        results.details.push({
          category,
          testNumber: index + 1,
          subject: test.subject,
          expected: test.expected,
          actual: result,
          passed: passed
        });
        
        // Log individual test result
        console.log(`Test ${index + 1}: ${passed ? 'PASSED' : 'FAILED'}`);
        if (!passed) {
          console.log(`  Subject: ${test.subject}`);
          console.log(`  Expected: ${test.expected}, Got: ${result}`);
        }
      } catch (error) {
        // Handle test errors
        results.failed++;
        results.details.push({
          category,
          testNumber: index + 1,
          subject: test.subject,
          error: error.message,
          passed: false
        });
        console.log(`Test ${index + 1}: ERROR - ${error.message}`);
      }
    });
  });

  // Log summary
  console.log('\nTest Summary:');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  // Export detailed results to spreadsheet if needed
  exportTestResults(results);
  
  return results;
}

/**
 * Exports test results to a Google Spreadsheet for detailed analysis
 * @param {Object} results - Test results object
 */
function exportTestResults(results) {
  try {
    const ss = SpreadsheetApp.create(`GenAI Email Detection Tests - ${new Date().toISOString().split('T')[0]}`);
    const sheet = ss.getActiveSheet();
    
    // Set headers
    sheet.getRange('A1:F1').setValues([['Category', 'Test #', 'Subject', 'Expected', 'Actual', 'Passed']]);
    
    // Add results
    const rowData = results.details.map(r => [
      r.category,
      r.testNumber,
      r.subject,
      r.error ? 'ERROR' : r.expected,
      r.error ? r.error : r.actual,
      r.passed ? 'YES' : 'NO'
    ]);
    
    if (rowData.length > 0) {
      sheet.getRange(2, 1, rowData.length, 6).setValues(rowData);
    }
    
    // Format spreadsheet
    sheet.autoResizeColumns(1, 6);
    sheet.getRange('A1:F1').setBackground('#f3f3f3').setFontWeight('bold');
    
    console.log(`Results exported to spreadsheet: ${ss.getUrl()}`);
  } catch (error) {
    console.error('Error exporting results:', error);
  }
}
