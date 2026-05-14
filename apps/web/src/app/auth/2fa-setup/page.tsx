import TwoFactorSetupClient from "@/components/auth/TwoFactorSetupClient";

export default function TwoFASetupPage() {
  return (
    <main>
      <h1 className="sr-only">2-Faktor bestätigen</h1>
      <TwoFactorSetupClient />
    </main>
  );
}
