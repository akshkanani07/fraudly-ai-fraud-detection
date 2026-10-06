import {
  EmailButton,
  EmailCallout,
  EmailFallbackLink,
  EmailLayout,
  EmailText,
  EmailTitle,
} from "./email-layout";

export interface MagicLinkEmailProps {
  magicLinkUrl: string;
  expiresIn?: string;
}

export function MagicLinkEmail({
  magicLinkUrl,
  expiresIn = "5 minutes",
}: MagicLinkEmailProps) {
  return (
    <EmailLayout preview="Your secure sign-in link for Fraudly. It expires in 5 minutes.">
      <EmailTitle>Sign in to Fraudly</EmailTitle>
      <EmailText>Hi there,</EmailText>
      <EmailText>
        Use the button below to sign in to your Fraudly account instantly. No password
        is required. This secure link can only be used once.
      </EmailText>

      <EmailButton href={magicLinkUrl}>Sign in to Fraudly</EmailButton>

      <EmailCallout>
        This link expires in {expiresIn}. If you did not request it, you can safely
        ignore this email. Your account remains secure, and nobody can sign in without
        access to this message.
      </EmailCallout>

      <EmailFallbackLink url={magicLinkUrl} />
    </EmailLayout>
  );
}