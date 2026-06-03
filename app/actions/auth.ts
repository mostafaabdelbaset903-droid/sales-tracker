"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    redirect("/login?error=missing-password");
  }

  if (password !== appPassword) {
    redirect("/login?error=wrong-password");
  }

  const cookieStore = await cookies();

  cookieStore.set("sales_tracker_auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",

    // 3 Hours Session
    maxAge: 60 * 60 * 3,
  });

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();

  cookieStore.delete("sales_tracker_auth");

  redirect("/login");
}
