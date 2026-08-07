import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="not-found"><span>404 / SIGNAL LOST</span><h1>NOT ON<br />THE SHELF.</h1><p>The product or page moved, sold through, or never existed.</p><Button asChild><Link href="/menu">Return to the menu</Link></Button></main>;
}
