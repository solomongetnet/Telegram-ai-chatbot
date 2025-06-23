import express, { Request, Response } from "express";
import { Telegraf } from "telegraf";
import { setWebhook } from "./src/helper/webhook";

import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const BOT_TOKEN = process.env.BOT_TOKEN as string;
const PORT = (process.env.PORT as string) || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;

export const bot = new Telegraf(BOT_TOKEN);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const app = express();

bot.start((ctx) =>
  ctx.reply(
    "Welcome! This bot is built by @solgetdev. Send me a message and I'll echo it back to you! "
  )
);

bot.help((ctx) =>
  ctx.reply("Send me any message and I'll echo it back to you.")
);

bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;

  // React immediately to show message was received
  await ctx.react("❤‍🔥");

  // Send "thinking" message and store its ID
  const thinkingMsg = await ctx.replyWithAnimation(
    "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOXd4ZXZmOTllMmtqanV1Z2ZkZmUzYXczZmhtMzBhdHpocndvanZnMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tXL4FHPSnVJ0A/giphy.gif"
  );
  try {
    // Enhanced prompt for Gemini
    const prompt = `You are a helpful AI assistant in a Telegram chat. Respond to the user's message in a friendly, concise manner (1-3 paragraphs max). 
              User message: ${userMessage}
              
              Guidelines:
              - Format responses with MarkdownV2 (escape special characters)
              - Use emojis sparingly for friendliness
              `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    await ctx.deleteMessage(thinkingMsg.message_id);

    // Process and format the response
    let reply = response.text?.trim() || "❌ I couldn't generate a response.";

    // Send reply with typing indicator
    await ctx.sendChatAction("typing");
    await ctx.reply(reply, {
      parse_mode: "MarkdownV2",
    });
  } catch (error: any) {
    console.error("Google GenAI error:", error);

    // Error handling for thinking message deletion
    await ctx.deleteMessage(thinkingMsg.message_id);

    // Send appropriate error message (without Markdown to avoid errors)
    let errorMessage = "⚠ Error while contacting Gemini AI.";

    if (error.message.includes("safety")) {
      errorMessage =
        "🚫 My response was blocked by safety filters. Please try a different question.";
    } else if (error.message.includes("quota")) {
      errorMessage = "📉 I've reached my API limit. Please try again later.";
    }

    await ctx.reply(errorMessage, {});
  }
});

bot
  .launch()
  .then(() => console.log("Bot started"))
  .catch(console.error);

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello, this is the Gemini AI bot server!" });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await setWebhook();
});
