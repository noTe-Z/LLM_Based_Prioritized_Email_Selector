function isGenAIEmail(email) {

  const openAiApiKey = 'YOUR_OPENAI_API_KEY'; // Replace with your OpenAI API key

  const truncatedBody = email.body.substring(0, 10000); // Truncate if over 10,000 characters

  const prompt = `

  The following email may or may not be related to Generative AI. Tell me "yes" if it is related, "no" if it isn't.

  Email content: "${truncatedBody}"

  `;

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
