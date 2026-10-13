import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Employee Access" };
type Props = { searchParams: Promise<{ error?: string }> };

export default async function EmployeeLoginPage({ searchParams }: Props) {
  const query = await searchParams;
  return (
    <main className="employee-login">
      <section className="employee-login-art" aria-label="UP N SMOKE employee operations">
        <div className="employee-login-brand"><ShieldCheck aria-hidden="true" /><span><b>UP N SMOKE</b><small>Employee operations</small></span></div>
        <div className="employee-login-message"><h1>STAFF<br /><em>TERMINAL</em></h1><p>Pickup verification, inventory, and store operations in one secure workspace.</p></div>
        <small className="employee-login-security">Authorized personnel only</small>
      </section>
      <section className="employee-login-form">
        <Link href="/" className="employee-login-back"><ArrowLeft aria-hidden="true" /> Back to storefront</Link>
        <div className="employee-login-intro"><span>Employee operations</span><h2>OPEN YOUR SHIFT</h2><p>Sign in to access pickup verification and in-store operations.</p></div>
        {query.error && <p className="form-error" role="alert">{query.error}</p>}
        <form action="/api/auth/employee/login" method="post">
          <label>Employee email<Input name="email" type="email" inputMode="email" autoCapitalize="none" autoComplete="username" placeholder="name@upnsmoke.com" required /></label>
          <label>Password<Input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required /></label>
          <Button size="lg"><KeyRound aria-hidden="true" /> Enter operations</Button>
        </form>
      </section>
    </main>
  );
}
