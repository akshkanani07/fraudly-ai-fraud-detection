import {
  EmailButton,
  EmailCallout,
  EmailFallbackLink,
  EmailLayout,
  EmailText,
  EmailTitle,
} from "./email-layout";

export interface ResetPasswordEmailProps {
  name: string;
  resetUrl: string;
  expiresIn?: string;
}

export function ResetPasswordEmail({
  name,
  resetUrl,
  expiresIn = "1 hour",
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout preview="Reset your Fraudly password. This link expires in 1 hour.">
      <EmailTitle>Reset your password</EmailTitle>
      <EmailText>Hi {name},</EmailText>
      <EmailText>
        We received a request to reset the password for your Fraudly account. Click the
        button below to choose a new password.
      </EmailText>

      <EmailButton href={resetUrl}>Reset password</EmailButton>

      <EmailCallout>
        This link expires in {expiresIn}. If you did not request a password reset, no
        action is needed. Your current password will keep working. If you are concerned
        about your account security, please contact your administrator.
      </EmailCallout>

      <EmailFallbackLink url={resetUrl} />
    </EmailLayout>
  );
}