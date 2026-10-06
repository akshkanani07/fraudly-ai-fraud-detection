import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Database,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  roles?: Array<"user" | "admin" | "analyst">;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Detection",
    items: [
      {
        title: "Transactions",
        href: "/transactions",
        icon: Receipt,
      },
      {
        title: "Fraud Detection",
        href: "/fraud-detection",
        icon: ShieldAlert,
      },
      {
        title: "Audit Logs",
        href: "/audit-logs",
        icon: Activity,
      },
    ],
  },
  {
    title: "Machine Learning",
    items: [
      {
        title: "Datasets",
        href: "/datasets",
        icon: Database,
      },
      {
        title: "Models",
        href: "/models",
        icon: Brain,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: FileText,
      },
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
      },
      {
        title: "Users",
        href: "/users",
        icon: Users,
        roles: ["admin"],
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];