"use client";

import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth/auth-client";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="p-10">
      <h1>Dashboard</h1>

      <button
        className="mt-6 rounded bg-red-600 px-4 py-2 text-white"
        onClick={async () => {
          await signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push("/login");
              },
            },
          });
        }}
      >
        Logout
      </button>
    </div>
  );
}