import Link from "next/link";
import { SettingsKeysForm } from "@/components/SettingsKeysForm";

export default function SettingsPage() {
  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-foreground text-sm">
          ← Dashboard
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400 mb-8">
        Bring your own API keys (BYOK). Keys are encrypted at rest and never logged.
      </p>
      <div className="max-w-md rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
        <h2 className="font-semibold text-foreground mb-4">OpenAI API key</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Required for AI blueprint generation, module content, H5P generation, and image generation.
        </p>
        <SettingsKeysForm />
      </div>
    </main>
  );
}
