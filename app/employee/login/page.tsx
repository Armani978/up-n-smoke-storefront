import { KeyRound, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Employee Access" };
type Props = { searchParams: Promise<{ error?: string }> };

export default async function EmployeeLoginPage({ searchParams }: Props) {
  const query = await searchParams;
  return <main className="employee-login"><section className="employee-login-art"><span>AUTHORIZED PERSONNEL / UNS OPS</span><h1>STAFF<br /><em>TERMINAL.</em></h1><div><ShieldCheck /><b>MEDUSA<br />SECURED</b></div></section><section className="employee-login-form"><Link href="/" className="eyebrow">← Back to storefront</Link><div><span className="eyebrow">Team access</span><h2>OPEN SHIFT</h2><p>Use your Medusa Admin credentials. Your email maps to a platform role on the server.</p></div>{query.error && <p className="form-error">{query.error}</p>}<form action="/api/auth/employee/login" method="post"><label>Employee email<Input name="email" type="email" autoComplete="username" required /></label><label>Password<Input name="password" type="password" autoComplete="current-password" required /></label><Button size="lg"><KeyRound /> Enter operations</Button></form></section></main>;
}
