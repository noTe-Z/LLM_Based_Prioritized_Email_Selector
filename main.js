function isGenAIEmail(email) {

  const openAiApiKey = 'YOUR_OPENAI_API_KEY'; // Replace with your OpenAI API key

  const truncatedBody = email.body.substring(0, 10000); // Truncate if over 10,000 characters

const prompt = `
Please analyze the following email and determine if it falls into any of these categories:
1. Academic/Professional Request - requests or questions from professors, recruiters, coworkers, or students
2. Career Opportunity - job opportunities, applications, offers, interview requests
3. GenAI News/Opportunities - news, updates, or opportunities related to Generative AI

Email Subject: "${email.subject}"
Email Content: "${truncatedBody}"

Respond with ONLY ONE of these exact words:
- "academic" - if it's category 1
- "career" - if it's category 2
- "genai" - if it's category 3
- "no" - if it doesn't match any category

Provide only one word response without explanation or punctuation.`;

  const requestData = {

model: "gpt-3.5-turbo",

messages: [

   { "role": "user", "content": prompt }

],

max_tokens: 10,

temperature: 0

  };

  const options = {

method: 'post',

contentType: 'application/json',

headers: {

   'Authorization': Bearer ${openAiApiKey}

},

payload: JSON.stringify(requestData)

  };

  const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);

  const jsonResponse = JSON.parse(response.getContentText());

  const reply = jsonResponse.choices[0].message.content.trim().toLowerCase();

  return reply === 'yes';

}

function checkLatestEmailsForGenAI() {

  const threads = GmailApp.search("newer_than:10d"); // Adjust the search criteria as needed

  const messages = GmailApp.getMessagesForThreads(threads);

  messages.flat().forEach(message => {

const email = {

   subject: message.getSubject(),

   body: message.getPlainBody()

};

const isRelatedToGenAI = isGenAIEmail(email);

console.log(`Email Subject: "${email.subject}"`);

console.log(`Is related to GenAI: ${isRelatedToGenAI}`);

  });

}

  var jsonResponse = JSON.parse(response.getContentText());

 

  // Extract and return GPT's response

  return jsonResponse.choices[0].text;

}
