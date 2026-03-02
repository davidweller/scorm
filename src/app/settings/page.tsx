import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href="/" className="text-secondary hover:text-foreground text-sm">
          ← Dashboard
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="mt-2 text-secondary">
        Bring your own API keys (BYOK). Keys are encrypted and stored per user.
      </p>
      <div className="mt-8 max-w-md rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
        <h2 className="font-semibold text-foreground">OpenAI API key</h2>
        <p className="mt-2 text-sm text-secondary">
          Required for blueprint generation, module content, H5P generation, and images.
          Key input and encrypted storage will be implemented in Phase 1.
        </p>
      </div>
    </main>
  );
}
