import { telegramService } from '@platforms/telegram.js';
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

async function bootstrap() {
  try {
    // Start Telegram
    telegramService.start();

    // Later you can add:
    // whatsappService.start();
    // scheduler.init();
    
    console.log("🚀 Chotu AI System is fully operational.");
  } catch (error) {
    console.error("Failed to start Chotu AI:", error);
    process.exit(1);
  }
}

bootstrap();