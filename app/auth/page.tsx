import { AuthForm } from "@/components/AuthForm";

export default function AuthPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sign in</h1>
      <p className="mt-2 text-ink/70">
        Connect the app to your Supabase account before saving tariff projects to shared
        storage.
      </p>
      <AuthForm />
    </section>
  );
}
