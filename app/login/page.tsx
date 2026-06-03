import { LockKeyhole, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
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
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.25),_transparent_35%)]" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl md:grid-cols-2">
          <section className="hidden bg-gradient-to-br from-blue-600 via-slate-900 to-emerald-600 p-10 md:block">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  LG Sales Performance System
                </div>

                <h1 className="text-4xl font-black leading-tight">
                  Sales & Commission Tracker
                </h1>

                <p className="mt-4 max-w-sm text-white/80">
                  Track targets, commissions, incentives, achievements, and
                  category performance from one secure dashboard.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl bg-white/10 p-4">
                  <TrendingUp className="mb-3 h-6 w-6" />
                  <p className="font-semibold">Real-time Sales Insights</p>
                  <p className="mt-1 text-sm text-white/70">
                    Monitor category targets and monthly progress clearly.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <ShieldCheck className="mb-3 h-6 w-6" />
                  <p className="font-semibold">Protected Access</p>
                  <p className="mt-1 text-sm text-white/70">
                    Secure entry for your sales tracking workspace.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-background p-6 text-foreground sm:p-10">
            <div className="mx-auto flex min-h-[560px] max-w-md flex-col justify-center">
              <div className="mb-8">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                  <LockKeyhole className="h-7 w-7" />
                </div>

                <h2 className="text-3xl font-black tracking-tight">
                  Welcome Back
                </h2>

                <p className="mt-2 text-muted-foreground">
                  Enter your password to access the sales dashboard.
                </p>
              </div>

              {error === "wrong-password" && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  Wrong password. Please try again.
                </div>
              )}

              {error === "missing-password" && (
                <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-300">
                  APP_PASSWORD is missing in Vercel Environment Variables.
                </div>
              )}

              <form action={loginAction} className="space-y-5">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold"
                  >
                    App Password
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Enter secure password"
                    className="h-14 w-full rounded-2xl border border-input bg-background px-5 text-base text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                </div>

                <button
                  type="submit"
                  className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg transition hover:scale-[1.01] hover:opacity-90 active:scale-[0.99]"
                >
                  Unlock Dashboard
                </button>
              </form>

              <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Secure access enabled by Vercel Environment Variables. Your
                  password is never stored inside the public code.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
