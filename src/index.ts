import { telegramService } from "@/platforms/index.js";
import { whatsAppService } from "@/platforms/index.js";
// import { setDefaultResultOrder } from "node:dns";
// setDefaultResultOrder("ipv4first");

async function bootstrap() {
  try {
    telegramService.start();
    whatsAppService.start();
    
    console.log("🚀 Chotu AI System is fully operational.");
  } catch (error) {
    console.error("Failed to start Chotu AI:", error);
    process.exit(1);
  }
}

bootstrap();