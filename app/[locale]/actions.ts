"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const DEMO_EMAIL = "demo@striveapp.cc";

/**
 * Sign in as the shared demo account and land on Rhythm (the `/protected/flow`
 * route). The password lives only in the server env (DEMO_USER_PASSWORD) and
 * never reaches the client. The demo is English-only, so we always redirect to
 * the clean (en) URL; visitors are told French is available on real accounts.
 *
 * On any failure (missing password, bad credentials) we fall back to the login
 * page rather than surfacing an error on the landing hero.
 */
export async function signInAsDemo() {
  const password = process.env.DEMO_USER_PASSWORD;
  if (!password) redirect("/auth/login");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password,
  });

  if (error) redirect("/auth/login");

  redirect("/protected/flow");
}
