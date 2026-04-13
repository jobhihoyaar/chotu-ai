import express, { type Express } from "express";
import { type Server } from "node:http";

export class WebhookService {
  private app: Express;
  private server: Server | null = null;

  constructor() {
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.get("/ping", (_req, res) => {
      res.status(200).json({ message: "pong" });
    });
  }

  public start() {
    if (this.server) return;

    const port = Number(process.env.PORT || 3000);
    this.server = this.app.listen(port, () => {
      console.log(`[Webhook] Server listening on port ${port}. GET /ping`);
    });
  }
}

export const webhookService = new WebhookService();
