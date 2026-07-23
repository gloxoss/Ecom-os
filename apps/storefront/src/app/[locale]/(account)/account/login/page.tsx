import { LoginClient } from "@/features/account/ui/login-client";

export const metadata = {
  title: "Sign In | Angelina",
  description: "Access your Angelina account.",
};

export default function LoginPage() {
  return (
    <div className="bg-input min-h-screen pt-[140px] md:pt-[160px]">
      <LoginClient />
    </div>
  );
}
