import { AuthForm } from "@/components/AuthForm";

export default function AuthPage() {
  return (
    <section className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-ink/70">
        Connect the app to your Supabase account before saving tariff projects to shared
        storage.
      </p>
      <AuthForm />
    </section>
  );
}
