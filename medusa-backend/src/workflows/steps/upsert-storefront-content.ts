import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { STOREFRONT_CONTENT_MODULE } from "../../modules/storefront-content"

type Input = { key: string; content: Record<string, unknown> }

export const upsertStorefrontContentStep = createStep(
  "upsert-storefront-content",
  async (input: Input, { container }) => {
    const service = container.resolve(STOREFRONT_CONTENT_MODULE) as {
      listStorefrontContents: (filters: Record<string, unknown>, config?: Record<string, unknown>) => Promise<Array<{ id: string }>>
      createStorefrontContents: (data: Input) => Promise<unknown>
      updateStorefrontContents: (data: Input & { id: string }) => Promise<unknown>
    }
    const [existing] = await service.listStorefrontContents({ key: input.key }, { take: 1 })
    const content = existing
      ? await service.updateStorefrontContents({ ...input, id: existing.id })
      : await service.createStorefrontContents(input)
    return new StepResponse(content)
  },
)
