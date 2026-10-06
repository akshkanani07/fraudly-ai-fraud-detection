import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface VerifyEmailEmailProps {
  name: string;
  url: string;
  token: string;
}

export function VerifyEmailEmail({ name, url, token }: VerifyEmailEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your Fraudly account email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verify your email</Heading>

          <Text style={text}>Hi {name},</Text>

          <Text style={text}>
            Thanks for signing up for Fraudly. Please verify your email address
            to activate your account and start detecting fraud with AI.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={url}>
              Verify Email Address
            </Button>
          </Section>

          <Text style={text}>
            This link will expire in 24 hours. If you didn&apos;t create a
            Fraudly account, you can safely ignore this email.
          </Text>

          <Hr style={hr} />

          <Text style={smallText}>
            If the button doesn&apos;t work, copy and paste this URL into your
            browser:
          </Text>
          <Link href={url} style={link}>
            {url}
          </Link>

          <Text style={smallText}>Verification code: {token}</Text>

          <Hr style={hr} />

          <Text style={footer}>
            — The Fraudly Team
            <br />
            Enterprise AI Fraud Detection
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default VerifyEmailEmail;

/* ============================================================
 * Styles
 * ============================================================ */
const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 32px",
  borderRadius: "12px",
  maxWidth: "560px",
  border: "1px solid #e5e7eb",
};

const h1: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 20px",
  padding: 0,
};

const text: React.CSSProperties = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const smallText: React.CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 8px",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "28px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#0f172a",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "12px 24px",
};

const link: React.CSSProperties = {
  color: "#2563eb",
  fontSize: "13px",
  textDecoration: "underline",
  wordBreak: "break-all",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
};