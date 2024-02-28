const OpenAI = require("openai");
require('dotenv').config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function runCompletion() {
  const completion = await openai.completions.create({
    model: "text-davinci-003",
    prompt: "How are you today?",
    max_tokens: 4000
  });
  console.log(completion.choices[0].text);
}

runCompletion();