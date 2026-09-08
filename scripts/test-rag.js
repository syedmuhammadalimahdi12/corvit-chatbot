// Quick sanity check for the retrieval logic + the chat function handler.
// Run with:  node scripts/test-rag.js
const path = require("path");
const { handler } = require("../netlify/functions/chat");

const questions = [
  "Which course is best for me if I like maths and want an AI job?",
  "What's the difference between NAVTTC and paid batches?",
  "Do you teach CCNA?",
  "What is the capital of France?", // should show "no local match" behavior
];

(async () => {
  for (const q of questions) {
    const res = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ message: q, history: [] }),
    });
    const body = JSON.parse(res.body);
    console.log("\nQ:", q);
    console.log("status:", res.statusCode);
    console.log("sources matched:", body.sources);
    console.log("modelUsed:", body.modelUsed);
    console.log("reply:", body.reply);
  }
})();
