import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createInventoryItemsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  updateProductsWorkflow,
  updateInventoryItemsWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"
import { XMLParser } from "fast-xml-parser"
import JSZip from "jszip"

type ImportBody = {
  file_base64?: string
  dry_run?: boolean
}

type ParsedRow = {
  row: number
  sku: string
  quantity: number
  name: string
  price: number
  category: string
  description: string
  productCode: string
  image: string
  hidden: boolean
}

const SKU_HEADERS = ["sku", "item sku", "variant sku"]
const PRODUCT_CODE_HEADERS = ["product code", "upc", "barcode"]
const QUANTITY_HEADERS = ["quantity", "qty", "stock", "inventory", "on hand", "on_hand", "stocked quantity"]
const NAME_HEADERS = ["name", "item name", "product name", "title"]
const PRICE_HEADERS = ["price", "retail price", "sell price"]
const CATEGORY_HEADERS = ["categories", "category", "category name", "department"]
const DESCRIPTION_HEADERS = ["description", "desc"]
const IMAGE_HEADERS = ["image", "image url", "image_url", "photo", "photo url", "thumbnail"]
const HIDDEN_HEADERS = ["hidden?", "hidden", "show in register app"]

const normalize = (value: unknown) => String(value ?? "").trim()
const firstColumn = (headers: Map<string, number>, aliases: string[]) => aliases.map((key) => headers.get(key)).find(Boolean)
const parseNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(normalize(value).replace(/[$,]/g, ""))
  return Number.isFinite(parsed) ? parsed : fallback
}
const toArray = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value]

function readCell(cell: any, sharedStrings: string[]) {
  const raw = cell.t === "inlineStr" ? cell.is?.t : cell.v
  if (cell.t === "s") return sharedStrings[Number(raw)] ?? ""
  if (cell.t === "str" || cell.t === "inlineStr") return raw ?? ""
  return raw === undefined ? "" : Number(raw)
}

function parseSheet(parsedSheet: any, sharedStrings: string[]) {
  const cellsByRow = new Map<number, Map<number, unknown>>()
  for (const xmlRow of toArray<any>(parsedSheet?.worksheet?.sheetData?.row)) {
    const rowNumber = Number(xmlRow.r)
    const rowCells = new Map<number, unknown>()
    for (const cell of toArray<any>(xmlRow.c)) {
      const letters = String(cell.r ?? "").match(/^[A-Z]+/)?.[0] ?? "A"
      let column = 0
      for (const letter of letters) column = column * 26 + letter.charCodeAt(0) - 64
      rowCells.set(column, readCell(cell, sharedStrings))
    }
    cellsByRow.set(rowNumber, rowCells)
  }
  return cellsByRow
}

function rowsFromSheet(cellsByRow: Map<number, Map<number, unknown>>) {
  let headerRow = 0
  let headers = new Map<string, number>()
  for (const [rowNumber, cells] of cellsByRow) {
    const candidate = new Map<string, number>()
    for (const [column, value] of cells) candidate.set(normalize(value).toLowerCase(), column)
    if (firstColumn(candidate, SKU_HEADERS) && firstColumn(candidate, QUANTITY_HEADERS)) {
      headerRow = rowNumber
      headers = candidate
      break
    }
  }
  if (!headerRow) return []

  const skuColumn = firstColumn(headers, SKU_HEADERS)
  const productCodeColumn = firstColumn(headers, PRODUCT_CODE_HEADERS)
  const quantityColumn = firstColumn(headers, QUANTITY_HEADERS)
  const nameColumn = firstColumn(headers, NAME_HEADERS)
  const priceColumn = firstColumn(headers, PRICE_HEADERS)
  const categoryColumn = firstColumn(headers, CATEGORY_HEADERS)
  const descriptionColumn = firstColumn(headers, DESCRIPTION_HEADERS)
  const imageColumn = firstColumn(headers, IMAGE_HEADERS)
  const hiddenColumn = firstColumn(headers, HIDDEN_HEADERS)
  if (!skuColumn || !quantityColumn) return []

  const rows: ParsedRow[] = []
  for (const [rowNumber, row] of cellsByRow) {
    if (rowNumber <= headerRow) continue
    const productCode = productCodeColumn ? normalize(row.get(productCodeColumn)) : ""
    const sku = normalize(row.get(skuColumn)) || productCode
    const rawQuantity = row.get(quantityColumn)
    const name = nameColumn ? normalize(row.get(nameColumn)) : sku
    if (!sku && !name && normalize(rawQuantity) === "") continue
    if (!sku) throw new Error(`Row ${rowNumber}: SKU or Product Code is required.`)
    const quantity = parseNumber(rawQuantity, NaN)
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error(`Row ${rowNumber}: Quantity must be a whole number of zero or more.`)
    }
    const hiddenValue = hiddenColumn ? normalize(row.get(hiddenColumn)).toLowerCase() : "no"
    rows.push({
      row: rowNumber,
      sku,
      quantity,
      name: name || sku,
      price: Math.max(0, priceColumn ? parseNumber(row.get(priceColumn)) : 0),
      category: categoryColumn ? normalize(row.get(categoryColumn)) || "Uncategorized" : "Uncategorized",
      description: descriptionColumn ? normalize(row.get(descriptionColumn)) : "",
      productCode,
      image: imageColumn ? normalize(row.get(imageColumn)) : "",
      hidden: hiddenValue === "yes" || hiddenValue === "true" || hiddenValue === "1" || hiddenValue === "no" && headers.has("show in register app"),
    })
  }
  return rows
}

async function parseWorkbook(fileBase64: string): Promise<ParsedRow[]> {
  const bytes = Buffer.from(fileBase64, "base64")
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) {
    throw new Error("The workbook must be a non-empty XLSX file smaller than 10 MB.")
  }

  const zip = await JSZip.loadAsync(bytes)
  const parser = new XMLParser({ignoreAttributes: false, attributeNamePrefix: "", parseTagValue: false, removeNSPrefix: true})
  const sharedStrings: string[] = []
  const sharedFile = zip.file("xl/sharedStrings.xml")
  if (sharedFile) {
    const parsed = parser.parse(await sharedFile.async("string"))
    for (const entry of toArray<any>(parsed?.sst?.si)) {
      const fragments = entry?.r ? toArray<any>(entry.r).map((part) => part?.t ?? "") : [entry?.t ?? ""]
      sharedStrings.push(fragments.join(""))
    }
  }

  const sheetFiles = Object.keys(zip.files)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]))
  for (const path of sheetFiles) {
    const file = zip.file(path)
    if (!file) continue
    const rows = rowsFromSheet(parseSheet(parser.parse(await file.async("string")), sharedStrings))
    if (rows.length) {
      const duplicate = rows.find((row, index) => rows.findIndex((other) => other.sku.toLowerCase() === row.sku.toLowerCase()) !== index)
      if (duplicate) throw new Error(`Duplicate SKU in workbook: ${duplicate.sku}`)
      return rows
    }
  }
  throw new Error("No inventory sheet with SKU and Quantity columns was found. Clover exports should include an Items tab.")
}

const chunks = <T>(items: T[], size: number) => Array.from({length: Math.ceil(items.length / size)}, (_, index) => items.slice(index * size, (index + 1) * size))
const safeHandle = (sku: string, index: number) => `clover-${sku}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180)

export async function POST(req: MedusaRequest<ImportBody>, res: MedusaResponse) {
  try {
    if (!req.body?.file_base64) return res.status(400).json({message: "An XLSX workbook is required."})

    const rows = await parseWorkbook(req.body.file_base64)
    const invalidPhoto = rows.find((row) => row.image && !/^(https:\/\/|\/(?!\/))/i.test(row.image))
    if (invalidPhoto) throw new Error(`Row ${invalidPhoto.row}: Product photo must be an HTTPS URL or a local /product-images path.`)
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const {data: inventoryItems} = await query.graph({
      entity: "inventory_item",
      fields: ["id", "sku", "title", "location_levels.id", "location_levels.location_id", "location_levels.stocked_quantity"],
    })
    const {data: productVariants} = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku", "product.id", "product.title", "product.thumbnail", "product.metadata"],
    })
    const bySku = new Map(inventoryItems.map((item: any) => [normalize(item.sku).toLowerCase(), item]))
    const variantBySku = new Map(productVariants.map((variant: any) => [normalize(variant.sku).toLowerCase(), variant]))
    const matched: any[] = []
    const toCreate: ParsedRow[] = []
    const toRepair: any[] = []
    const needsLevel: any[] = []
    for (const row of rows) {
      const item: any = bySku.get(row.sku.toLowerCase())
      const variant: any = variantBySku.get(row.sku.toLowerCase())
      const level = item?.location_levels?.[0]
      if (!item && variant) toRepair.push({...row, variant_id: variant.id})
      else if (!item) toCreate.push(row)
      else if (!level) needsLevel.push({...row, title: item.title, inventory_item_id: item.id})
      else matched.push({...row, title: item.title, previous_quantity: Number(level.stocked_quantity), inventory_item_id: item.id, level_id: level.id, location_id: level.location_id})
    }

    if (!req.body.dry_run) {
      const {data: locations} = await query.graph({entity: "stock_location", fields: ["id", "name"]})
      const location = locations.find((item: any) => /manchester/i.test(item.name)) ?? locations[0]
      if (!location) throw new Error("Medusa has no stock location configured.")

      if (toRepair.length) {
        const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
        for (const batch of chunks(toRepair, 100)) {
          const {result: repairedItems} = await createInventoryItemsWorkflow(req.scope).run({
            input: {items: batch.map((row) => ({sku: row.sku, title: row.name, location_levels: [{location_id: location.id, stocked_quantity: row.quantity}]}))},
          })
          await link.create(repairedItems.map((item: any, index: number) => ({
            [Modules.PRODUCT]: {variant_id: batch[index].variant_id},
            [Modules.INVENTORY]: {inventory_item_id: item.id},
          })))
        }
      }

      const productPhotoUpdates = rows.flatMap((row) => {
        const variant: any = variantBySku.get(row.sku.toLowerCase())
        if (!row.image || !variant?.product?.id || variant.product.thumbnail === row.image) return []
        return [{
          id: variant.product.id,
          thumbnail: row.image,
          metadata: {
            ...(variant.product.metadata ?? {}),
            photo_source: "inventory_import",
            photo_sku: row.sku,
          },
        }]
      })
      for (const batch of chunks(productPhotoUpdates, 100)) {
        await updateProductsWorkflow(req.scope).run({input: {products: batch}})
      }

      if (toCreate.length) {
        const [{data: profiles}, {data: salesChannels}, {data: existingCategories}] = await Promise.all([
          query.graph({entity: "shipping_profile", fields: ["id", "name", "type"]}),
          query.graph({entity: "sales_channel", fields: ["id", "name"]}),
          query.graph({entity: "product_category", fields: ["id", "name"]}),
        ])
        const profile = profiles.find((item: any) => item.type === "default") ?? profiles[0]
        const salesChannel = salesChannels.find((item: any) => /up n smoke|online pickup/i.test(item.name)) ?? salesChannels[0]
        if (!profile || !salesChannel) throw new Error("Medusa shipping profile or sales channel is not configured.")

        const categoryByName = new Map(existingCategories.map((item: any) => [normalize(item.name).toLowerCase(), item]))
        const categoryNames = [...new Set(toCreate.map((row) => row.category).filter(Boolean))]
        const missingCategoryNames = categoryNames.filter((name) => !categoryByName.has(name.toLowerCase()))
        if (missingCategoryNames.length) {
          const {result: createdCategories} = await createProductCategoriesWorkflow(req.scope).run({
            input: {product_categories: missingCategoryNames.map((name) => ({name, is_active: true}))},
          })
          for (const category of createdCategories) categoryByName.set(category.name.toLowerCase(), category)
        }

        let productIndex = 0
        for (const batch of chunks(toCreate, 50)) {
          await createProductsWorkflow(req.scope).run({
            input: {
              products: batch.map((row) => ({
                title: row.name,
                handle: safeHandle(row.sku, productIndex++),
                description: row.description || "Available for in-store pickup.",
                thumbnail: row.image || undefined,
                status: row.hidden ? ProductStatus.DRAFT : ProductStatus.PUBLISHED,
                shipping_profile_id: profile.id,
                category_ids: categoryByName.get(row.category.toLowerCase()) ? [categoryByName.get(row.category.toLowerCase()).id] : [],
                metadata: {clover_import: true, clover_product_code: row.productCode || null},
                options: [{title: "Format", values: ["Standard"]}],
                variants: [{title: row.name, sku: row.sku, manage_inventory: true, options: {Format: "Standard"}, prices: [{currency_code: "usd", amount: row.price}]}],
                sales_channels: [{id: salesChannel.id}],
              })),
            },
          })
        }
      }

      const inventoryItemsToRename = [...matched, ...needsLevel]
        .filter((item) => normalize(item.title).toLowerCase() === "standard")
      if (inventoryItemsToRename.length) {
        for (const batch of chunks(inventoryItemsToRename, 100)) {
          await updateInventoryItemsWorkflow(req.scope).run({
            input: {updates: batch.map((item) => ({id: item.inventory_item_id, title: item.name}))},
          })
        }
      }

      if (matched.length) {
        for (const batch of chunks(matched, 100)) {
          await updateInventoryLevelsWorkflow(req.scope).run({
            input: {updates: batch.map((item) => ({id: item.level_id, inventory_item_id: item.inventory_item_id, location_id: item.location_id, stocked_quantity: item.quantity}))},
          })
        }
      }

      if (toCreate.length || needsLevel.length) {
        const {data: refreshedItems} = await query.graph({entity: "inventory_item", fields: ["id", "sku", "location_levels.id"]})
        const refreshedBySku = new Map(refreshedItems.map((item: any) => [normalize(item.sku).toLowerCase(), item]))
        const levelRows = [...toCreate, ...needsLevel].flatMap((row) => {
          const item: any = refreshedBySku.get(row.sku.toLowerCase())
          return item && !item.location_levels?.length ? [{location_id: location.id, inventory_item_id: item.id, stocked_quantity: row.quantity}] : []
        })
        for (const batch of chunks(levelRows, 100)) {
          await createInventoryLevelsWorkflow(req.scope).run({input: {inventory_levels: batch}})
        }
      }
    }

    return res.json({
      dry_run: Boolean(req.body.dry_run),
      total_rows: rows.length,
      matched_count: matched.length,
      created_count: toCreate.length,
      repaired_count: toRepair.length,
      photo_updated_count: rows.filter((row) => row.image && variantBySku.has(row.sku.toLowerCase())).length,
      level_count: needsLevel.length,
      missing_count: 0,
      matched: matched.slice(0, 100).map(({inventory_item_id, level_id, location_id, description, category, price, productCode, image, hidden, ...item}) => item),
      created: toCreate.slice(0, 100).map(({row, sku, name, quantity, price, category}) => ({row, sku, name, quantity, price, category})),
      repaired: toRepair.slice(0, 100).map(({row, sku, name, quantity}) => ({row, sku, name, quantity})),
      missing: [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : normalize((error as any)?.message || (error as any)?.error || error)
    return res.status(400).json({message: message || "Unable to import workbook."})
  }
}
