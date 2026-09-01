import { StorefrontContentEditor } from "@/components/employee/storefront-content-editor"
import { requireEmployee } from "@/lib/auth/session"

export default async function ContentPage() {
  await requireEmployee("content.write")
  return <StorefrontContentEditor />
}
