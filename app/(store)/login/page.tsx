import { LockKeyhole, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Customer Login" };

type Props = { searchParams: Promise<{ mode?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const query = await searchParams;
  const registering = query.mode === "register";
  return (
    <main className="auth-page">
      <section className="auth-art"><span>MEMBER SIGNAL / 01</span><h1>YOUR<br /><em>STASH.</em></h1><div className="auth-circle"><UserRound /><b>UNS</b></div><p>Save addresses. Track pickup orders. Move through the counter faster.</p></section>
      <section className="auth-form">
        <div><span className="eyebrow">{registering ? "New customer" : "Welcome back"}</span><h2>{registering ? "CREATE ACCOUNT" : "SIGN IN"}</h2></div>
        {query.error && <p className="form-error" role="alert">{query.error}</p>}
        <form action={registering ? "/api/auth/customer/register" : "/api/auth/customer/login"} method="post">
          {registering && <div className="form-grid"><label>First name<Input name="firstName" autoComplete="given-name" required /></label><label>Last name<Input name="lastName" autoComplete="family-name" required /></label></div>}
          <label>Email address<Input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<Input name="password" type="password" minLength={8} autoComplete={registering ? "new-password" : "current-password"} required /></label>
          <Button size="lg"><LockKeyhole /> {registering ? "Create customer account" : "Enter account"}</Button>
        </form>
        <Link className="auth-switch" href={registering ? "/login" : "/login?mode=register"}>{registering ? "Already have an account? Sign in →" : "New here? Create an account →"}</Link>
      </section>
    </main>
  );
}
