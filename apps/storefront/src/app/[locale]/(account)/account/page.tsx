import { AccountDashboardClient } from "@/features/account/ui/account-dashboard-client";

export const metadata = {
  title: "My Account | Angelina",
  description: "Manage your Angelina account, orders, and addresses.",
};

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-background pt-[140px] md:pt-[160px]">
      <AccountDashboardClient />
    </div>
  );
}
