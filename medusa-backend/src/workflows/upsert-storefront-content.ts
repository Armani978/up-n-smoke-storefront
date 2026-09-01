import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { upsertStorefrontContentStep } from "./steps/upsert-storefront-content"

type Input = { key: string; content: Record<string, unknown> }

export const upsertStorefrontContentWorkflow = createWorkflow(
  "upsert-storefront-content",
  function (input: Input) {
    const content = upsertStorefrontContentStep(input)
    return new WorkflowResponse(content)
  },
)
