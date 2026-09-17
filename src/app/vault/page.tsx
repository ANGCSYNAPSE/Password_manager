import { redirect } from "next/navigation";
import AnimatedBackground from "@/components/AnimatedBackground";
import VaultDashboard from "@/components/VaultDashboard";
import { getSession } from "@/lib/auth";

export default async function VaultPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10">
        <VaultDashboard username={session.username} />
      </div>
    </div>
  );
}
