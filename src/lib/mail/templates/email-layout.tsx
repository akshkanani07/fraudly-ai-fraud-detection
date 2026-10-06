import type { CSSProperties, ReactNode } from "react";
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
} from "react-email";

import { clientEnv } from "@/config/env";

export const emailColors = {
  brand: "#4f46e5",
  brandDark: "#7c3aed",
  ink: "#0f172a",
  body: "#475569",
  muted: "#94a3b8",
  border: "#e6e8f2",
  surface: "#ffffff",
  canvas: "#f4f5fb",
  calloutBackground: "#f5f3ff",
  calloutBorder: "#ddd6fe",
} as const;

const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const gradient = `linear-gradient(135deg, ${emailColors.brand} 0%, ${emailColors.brandDark} 100%)`;

const styles = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: emailColors.canvas,
    fontFamily,
  } satisfies CSSProperties,
  container: {
    maxWidth: "560px",
    margin: "0 auto",
    padding: "40px 16px",
  } satisfies CSSProperties,
  card: {
    backgroundColor: emailColors.surface,
    border: `1px solid ${emailColors.border}`,
    borderRadius: "18px",
    overflow: "hidden",
  } satisfies CSSProperties,
  header: {
    backgroundColor: emailColors.brand,
    backgroundImage: gradient,
    padding: "36px 32px 32px",
    textAlign: "center",
  } satisfies CSSProperties,
  logoMark: {
    display: "inline-block",
    width: "48px",
    height: "48px",
    lineHeight: "48px",
    margin: "0 0 14px",
    borderRadius: "14px",
    backgroundColor: "rgba(255,255,255,0.18)",
    border: "1px solid rgba(255,255,255,0.35)",
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: 800,
    textAlign: "center",
  } satisfies CSSProperties,
  brandName: {
    margin: 0,
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: "0.4px",
  } satisfies CSSProperties,
  brandTagline: {
    margin: "6px 0 0",
    color: "rgba(255,255,255,0.78)",
    fontSize: "13px",
    letterSpacing: "0.3px",
  } satisfies CSSProperties,
  content: {
    padding: "40px 36px 36px",
  } satisfies CSSProperties,
  footer: {
    padding: "24px 16px 0",
    textAlign: "center",
  } satisfies CSSProperties,
  footerText: {
    margin: "0 0 6px",
    color: emailColors.muted,
    fontSize: "12px",
    lineHeight: "18px",
  } satisfies CSSProperties,
  footerLink: {
    color: emailColors.muted,
    textDecoration: "underline",
  } satisfies CSSProperties,
  title: {
    margin: "0 0 16px",
    color: emailColors.ink,
    fontSize: "26px",
    lineHeight: "34px",
    fontWeight: 700,
    letterSpacing: "-0.4px",
  } satisfies CSSProperties,
  text: {
    margin: "0 0 16px",
    color: emailColors.body,
    fontSize: "15px",
    lineHeight: "26px",
  } satisfies CSSProperties,
  buttonWrapper: {
    margin: "28px 0",
    textAlign: "center",
  } satisfies CSSProperties,
  button: {
    display: "inline-block",
    backgroundColor: emailColors.brand,
    backgroundImage: gradient,
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    textAlign: "center",
    padding: "15px 34px",
    borderRadius: "12px",
  } satisfies CSSProperties,
  callout: {
    margin: "0 0 8px",
    padding: "16px 18px",
    backgroundColor: emailColors.calloutBackground,
    border: `1px solid ${emailColors.calloutBorder}`,
    borderRadius: "12px",
  } satisfies CSSProperties,
  calloutText: {
    margin: 0,
    color: emailColors.body,
    fontSize: "13px",
    lineHeight: "21px",
  } satisfies CSSProperties,
  divider: {
    margin: "28px 0 20px",
    borderColor: emailColors.border,
  } satisfies CSSProperties,
  fallbackLabel: {
    margin: "0 0 6px",
    color: emailColors.muted,
    fontSize: "12px",
    lineHeight: "18px",
  } satisfies CSSProperties,
  fallbackLink: {
    margin: 0,
    color: emailColors.brand,
    fontSize: "12px",
    lineHeight: "18px",
    wordBreak: "break-all",
    textDecoration: "none",
  } satisfies CSSProperties,
};

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  const appName = clientEnv.NEXT_PUBLIC_APP_NAME;
  const appUrl = clientEnv.NEXT_PUBLIC_APP_URL;
  const year = new Date().getFullYear();

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Section style={styles.header}>
              <Text style={styles.logoMark}>{appName.charAt(0).toUpperCase()}</Text>
              <Text style={styles.brandName}>{appName}</Text>
              <Text style={styles.brandTagline}>Enterprise AI Fraud Detection</Text>
            </Section>
            <Section style={styles.content}>{children}</Section>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              This is an automated message from {appName}. Please do not reply to this
              email.
            </Text>
            <Text style={styles.footerText}>
              &copy; {year} {appName}.{" "}
              <Link href={appUrl} style={styles.footerLink}>
                {appUrl.replace(/^https?:\/\//, "")}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailTitle({ children }: { children: ReactNode }) {
  return (
    <Heading as="h1" style={styles.title}>
      {children}
    </Heading>
  );
}

export function EmailText({ children }: { children: ReactNode }) {
  return <Text style={styles.text}>{children}</Text>;
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={styles.buttonWrapper}>
      <Button href={href} style={styles.button}>
        {children}
      </Button>
    </Section>
  );
}

export function EmailCallout({ children }: { children: ReactNode }) {
  return (
    <Section style={styles.callout}>
      <Text style={styles.calloutText}>{children}</Text>
    </Section>
  );
}

export function EmailFallbackLink({ url }: { url: string }) {
  return (
    <>
      <Hr style={styles.divider} />
      <Text style={styles.fallbackLabel}>
        Button not working? Copy and paste this link into your browser:
      </Text>
      <Link href={url} style={styles.fallbackLink}>
        {url}
      </Link>
    </>
  );
}