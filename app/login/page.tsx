import { loginAction } from "@/app/actions/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Sales Tracker Login
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the app password to continue
          </p>
        </div>

        {error === "wrong-password" && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            Wrong password. Please try again.
          </div>
        )}

        {error === "missing-password" && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-300">
            APP_PASSWORD is missing in Vercel Environment Variables.
          </div>
        )}

        <form action={loginAction} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter password"
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
