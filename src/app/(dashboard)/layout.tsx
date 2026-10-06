import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata = {
  title: {
    default: "Dashboard | Fraudly",
    template: "%s | Fraudly",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  /* ---- Fetch Unread Notifications Count ---- */
  let unreadCount = 0;
  try {
    unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });
  } catch {
    unreadCount = 0;
  }

  return (
    <DashboardShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: (session.user as { role?: string }).role ?? "user",
      }}
      unreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}