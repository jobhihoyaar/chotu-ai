import { webhookService, telegramService } from "@/platforms/index.js";

async function bootstrap() {
  try {
    webhookService.start();
    telegramService.start();
    
    console.log("🚀 Chotu AI System is fully operational.");
  } catch (error) {
    console.error("Failed to start Chotu AI:", error);
    process.exit(1);
  }
}

bootstrap();