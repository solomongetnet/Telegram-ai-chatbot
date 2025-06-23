import { bot } from "../../index";
import "dotenv/config";

// Set Telegram webhook URL
const BOT_TOKEN = process.env.BOT_TOKEN as string;
const BASE_URL = "https://6120-196-189-144-92.ngrok-free.app"; // Your public HTTPS URL
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

async function setWebhook() {
  try {
    const webhookUrl = `${BASE_URL}${WEBHOOK_PATH}`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`Webhook set to: ${webhookUrl}`);
  } catch (error) {
    console.error("Failed to set webhook:", error);
  }
}

export { setWebhook };