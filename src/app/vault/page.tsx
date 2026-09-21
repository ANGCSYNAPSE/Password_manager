import { redirect } from "next/navigation";
import VaultDashboard from "@/components/VaultDashboard";
import { getSession } from "@/lib/auth";

export default async function VaultPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <VaultDashboard username={session.username} />;
}
