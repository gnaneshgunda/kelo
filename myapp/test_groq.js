const apiKey = process.env.VITE_GROQ_API_KEY || "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";
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192';

async function run() {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: "You are a helpful assistant." },
        { role: 'user', content: "Hello" }
      ]
    })
  });
  console.log(res.status, await res.text());
}
run();
