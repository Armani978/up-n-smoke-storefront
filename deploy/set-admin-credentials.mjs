import { Modules } from "@medusajs/framework/utils"

export default async function setAdminCredentials({ container }) {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD

  if (!email || !password || password.length < 16) {
    throw new Error("ADMIN_BOOTSTRAP_EMAIL and a 16+ character ADMIN_BOOTSTRAP_PASSWORD are required")
  }

  const authService = container.resolve(Modules.AUTH)
  const userService = container.resolve(Modules.USER)
  const users = await userService.listUsers({ email })

  if (users.length !== 1) {
    throw new Error(`Expected exactly one admin user for ${email}; found ${users.length}`)
  }

  const identities = await authService.listAuthIdentities(
    {},
    { relations: ["provider_identities"] }
  )
  const identity = identities.find((candidate) =>
    candidate.provider_identities?.some(
      (provider) => provider.provider === "emailpass" && provider.entity_id === email
    )
  )

  if (!identity) {
    throw new Error(`No email/password identity exists for ${email}`)
  }

  const update = await authService.updateProvider("emailpass", {
    entity_id: email,
    password,
  })

  if (!update.success) {
    throw new Error(update.error || "Unable to update the password")
  }

  await authService.updateAuthIdentities({
    id: identity.id,
    app_metadata: {
      ...(identity.app_metadata || {}),
      user_id: users[0].id,
    },
  })
}
