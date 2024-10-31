// Configuration object
const CONFIG = {
  OPENAI_API_KEY: 'your-api-key-here',
  TARGET_EMAIL: 'target@gmail.com', // Email address to forward messages to
  SCAN_INTERVAL: 30, // minutes
  LABEL_NAME: 'GenAI-Related'
};

// Create a trigger to run the script every 30 minutes
function createTimeDrivenTrigger() {
  ScriptApp.newTrigger('processNewEmails')
    .timeBased()
    .everyMinutes(CONFIG.SCAN_INTERVAL)
    .create();
}

// Main function to process new emails
function processNewEmails() {
  // Get emails from the last 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const searchQuery = `after:${thirtyMinutesAgo.toISOString()}`;
  const threads = GmailApp.search(searchQuery);
  
  // Create label if it doesn't exist
  let label = GmailApp.getUserLabelByName(CONFIG.LABEL_NAME);
  if (!label) {
    label = GmailApp.createLabel(CONFIG.LABEL_NAME);
  }
  
  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      if (isGenAIRelated(message)) {
        // Forward the email
        forwardEmail(message);
        // Label the original email
        thread.addLabel(label);
      }
    }
  }
}

// Function to check if an email is GenAI-related using GPT-3.5
function isGenAIRelated(message) {
  const subject = message.getSubject();
  const body = message.getPlainBody();
  
  // Prepare content for analysis
  const contentToAnalyze = `Subject: ${subject}\n\nBody: ${body.substring(0, 1000)}`; // Limit body length
  
  // Call GPT-3.5 API
  const response = callGPT35API(contentToAnalyze);
  return response.isGenAIRelated;
}

// Function to call GPT-3.5 API
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

// Function to forward email
function forwardEmail(message) {
  const subject = message.getSubject();
  const body = message.getBody();
  const from = message.getFrom();
  
  // Create forwarded message
  const forwardedBody = `
    ---------- Forwarded message ----------
    From: ${from}
    Date: ${message.getDate()}
    Subject: ${subject}
    
    ${body}
  `;
  
  // Send email
  GmailApp.sendEmail(
    CONFIG.TARGET_EMAIL,
    `[GenAI] ${subject}`,
    message.getPlainBody(), // Plain text version
    {
      htmlBody: forwardedBody, // HTML version
      from: Session.getActiveUser().getEmail()
    }
  );
}

// Function to test the setup
function testSetup() {
  try {
    // Test GPT-3.5 API connection
    const testResponse = callGPT35API("Test email about ChatGPT and LLMs");
    console.log("API Test Result:", testResponse);
    
    // Test label creation
    const label = GmailApp.getUserLabelByName(CONFIG.LABEL_NAME) || 
                 GmailApp.createLabel(CONFIG.LABEL_NAME);
    console.log("Label created/found:", label.getName());
    
    // Test trigger creation
    createTimeDrivenTrigger();
    console.log("Trigger created successfully");
    
    return "Setup test completed successfully";
  } catch (error) {
    console.error("Setup test failed:", error);
    return `Setup test failed: ${error.toString()}`;
  }
}
