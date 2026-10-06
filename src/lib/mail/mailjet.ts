import { Client, type SendEmailV3_1 } from "node-mailjet";

import { serverEnv } from "@/config/env";
import { createLogger } from "@/lib/logger/logger";

const log = createLogger("mail");

export interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
}

export class MailDeliveryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "MailDeliveryError";
  }
}

let mailjetClient: Client | null = null;

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 2)}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

function isMailjetConfigured(): boolean {
  return Boolean(
    serverEnv.MAILJET_API_KEY &&
      serverEnv.MAILJET_SECRET_KEY &&
      serverEnv.MAIL_FROM_EMAIL,
  );
}

function getMailjetClient(): Client {
  if (!mailjetClient) {
    log.info("Creating Mailjet client...");

    mailjetClient = new Client({
      apiKey: serverEnv.MAILJET_API_KEY,
      apiSecret: serverEnv.MAILJET_SECRET_KEY,
    });
  }

  return mailjetClient;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const { to, toName, subject, html, text } = input;

  log.info("==================================================");
  log.info("MAIL SEND START");
  log.info("==================================================");

  log.info({
    NODE_ENV: serverEnv.NODE_ENV,
    MAIL_FROM_EMAIL: serverEnv.MAIL_FROM_EMAIL,
    MAIL_FROM_NAME: serverEnv.MAIL_FROM_NAME,
    API_KEY_EXISTS: !!serverEnv.MAILJET_API_KEY,
    SECRET_KEY_EXISTS: !!serverEnv.MAILJET_SECRET_KEY,
  });

  log.info({
    to,
    subject,
    htmlLength: html.length,
    textLength: text.length,
  });

  if (!isMailjetConfigured()) {
    log.error("Mailjet configuration missing.");

    log.error({
      MAILJET_API_KEY: !!serverEnv.MAILJET_API_KEY,
      MAILJET_SECRET_KEY: !!serverEnv.MAILJET_SECRET_KEY,
      MAIL_FROM_EMAIL: serverEnv.MAIL_FROM_EMAIL,
      MAIL_FROM_NAME: serverEnv.MAIL_FROM_NAME,
    });

    if (serverEnv.NODE_ENV === "production") {
      throw new MailDeliveryError("Mailjet configuration missing");
    }

    log.warn("Development mode detected.");
    log.warn("Email not sent. Printing email content.");

    console.log("====================================");
    console.log("EMAIL TO:", to);
    console.log("SUBJECT:", subject);
    console.log("TEXT:");
    console.log(text);
    console.log("====================================");

    return;
  }

  const body: SendEmailV3_1.Body = {
    Messages: [
      {
        From: {
          Email: serverEnv.MAIL_FROM_EMAIL!,
          Name: serverEnv.MAIL_FROM_NAME,
        },
        To: [
          toName
            ? {
                Email: to,
                Name: toName,
              }
            : {
                Email: to,
              },
        ],
        Subject: subject,
        HTMLPart: html,
        TextPart: text,
      },
    ],
  };

  log.info("Mailjet request body prepared.");

  try {
    const client = getMailjetClient();

    log.info("Calling Mailjet API...");

    const response = await client
      .post("send", {
        version: "v3.1",
      })
      .request<SendEmailV3_1.Response>(body);

    log.info("Mailjet API response received.");

    log.info(response.body);

    const status = response.body.Messages?.[0]?.Status;

    log.info({
      status,
    });

    if (status !== "success") {
      throw new MailDeliveryError(
        `Mailjet returned status: ${String(status)}`,
      );
    }

    log.info({
      to: maskEmail(to),
      subject,
    });

    log.info("EMAIL SENT SUCCESSFULLY");
    log.info("==================================================");
  } catch (error) {
    log.error("MAILJET ERROR");

    console.error(error);

    log.error({
      err: error,
      to,
      subject,
    });

    if (error instanceof MailDeliveryError) {
      throw error;
    }

    throw new MailDeliveryError("Mail sending failed", {
      cause: error,
    });
  }
}