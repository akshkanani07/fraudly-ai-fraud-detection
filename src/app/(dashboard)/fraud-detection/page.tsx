import type { Metadata } from "next";

import { FraudDetectionPage } from "@/features/fraud-detection/components/fraud-detection-page";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Fraud Detection",
};

export default async function Page() {
  const session = await requirePermission({ prediction: ["read"] });
  const role = session.user.role;

  return (
    <FraudDetectionPage
      permissions={{
        canPredict: roleHasPermission(role, { prediction: ["create"] }),
        canTrain: roleHasPermission(role, { model: ["train"] }),
        canActivate: roleHasPermission(role, { model: ["activate"] }),
        canRetrain: roleHasPermission(role, { model: ["retrain"] }),
        canDelete: roleHasPermission(role, { model: ["delete"] }),
      }}
    />
  );
}