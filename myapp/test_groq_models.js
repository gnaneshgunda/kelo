const apiKey = process.env.VITE_GROQ_API_KEY || "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";
async function run() {
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json();
  console.log(data.data.map(m => m.id).join('\n'));
}
run();
