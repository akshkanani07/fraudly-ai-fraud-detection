import * as React from "react";
import { render } from "@react-email/render";

import { serverEnv, clientEnv } from "@/config/env";
import { createLogger } from "@/lib/logger/logger";
import { sendEmail } from "@/lib/mail/mailjet";

import { VerifyEmailEmail } from "@/lib/mail/templates/verify-email";
import { ResetPasswordEmail } from "@/lib/mail/templates/reset-password";
import { MagicLinkEmail } from "@/lib/mail/templates/magic-link";

const log = createLogger("mail-service");

/* ============================================================
 * Verification Email
 * ============================================================ */

interface VerificationEmailParams {
  to: string;
  name: string;
  url: string;
  token: string;
}

export async function sendVerificationEmail({
  to,
  name,
  url,
  token,
}: VerificationEmailParams): Promise<void> {
  const html = await render(
    <VerifyEmailEmail
      name={name}
      url={url}
      token={token}
    />,
  );

  await sendEmail({
    to,
    toName: name,
    subject: "Verify your Fraudly account",
    html,
    text: `Hi ${name},

Verify your Fraudly account by opening the link below:

${url}

Verification code:
${token}

This email was sent from ${clientEnv.NEXT_PUBLIC_APP_NAME}.`,
  });

  log.info({ to }, "Verification email sent");
}

/* ============================================================
 * Reset Password Email
 * ============================================================ */

interface ResetPasswordEmailParams {
  to: string;
  name: string;
  url: string;
}

export async function sendResetPasswordEmail({
  to,
  name,
  url,
}: ResetPasswordEmailParams): Promise<void> {
  const html = await render(
    <ResetPasswordEmail
      name={name}
      resetUrl={url}
    />,
  );

  await sendEmail({
    to,
    toName: name,
    subject: "Reset your Fraudly password",
    html,
    text: `Hi ${name},

Reset your password using the link below:

${url}

If you didn't request this, you can safely ignore this email.`,
  });

  log.info({ to }, "Reset password email sent");
}

/* ============================================================
 * Magic Link Email
 * ============================================================ */

interface MagicLinkEmailParams {
  to: string;
  url: string;
}

export async function sendMagicLinkEmail({
  to,
  url,
}: MagicLinkEmailParams): Promise<void> {
  const html = await render(
    <MagicLinkEmail
      magicLinkUrl={url}
    />,
  );

  await sendEmail({
    to,
    subject: "Your Fraudly magic sign-in link",
    html,
    text: `Click the link below to sign in:

${url}

This link expires in 5 minutes.`,
  });

  log.info({ to }, "Magic link email sent");
}

/* ============================================================
 * Welcome Email
 * ============================================================ */

interface WelcomeEmailParams {
  to: string;
  name: string;
}

export async function sendWelcomeEmail({
  to,
  name,
}: WelcomeEmailParams): Promise<void> {
  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px">
<h2>Welcome to Fraudly 🎉</h2>

<p>Hello ${name},</p>

<p>
Your account has been successfully verified.
You can now start using Fraudly.
</p>

<p>
<a href="${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard">
Open Dashboard
</a>
</p>

<p>
Regards,<br/>
Fraudly Team
</p>
</div>
`;

  await sendEmail({
    to,
    toName: name,
    subject: "Welcome to Fraudly",
    html,
    text: `Welcome ${name}!

Open Dashboard:

${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  log.info({ to }, "Welcome email sent");
}