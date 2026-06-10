import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

app.post("/chat", async (req, res) => {
  const { message, history } = req.body;
console.log(message, history)
  // 🔥 必须设置流式响应
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  try {
    const stream = await client.chat.completions.create({
      model: "deepseek-v4-flash",
      stream: true,
      messages: [
        {
          role: "system",
          content: "你是一个专业AI客服，回答简洁清晰。"
        },
        ...(history || []).map(m => ({
          role: m.role,
          content: m.text
        })),
        {
          role: "user",
          content: message
        }
      ]
    });

    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content || "";
      res.write(text);
    }

    res.end();

  } catch (err) {
    console.log(err);
    res.end("错误");
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});