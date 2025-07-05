import { connectToDatabase } from "../mongodb"
import { ObjectId } from "mongodb"

export interface AnzsicMapping {
  _id?: ObjectId
  anzsicCode: string
  anzsicDescription: string
  atoCategory: string
  isDeductible: boolean
  confidenceLevel: number
  source: "manual" | "ato" | "ai" | "comprehensive-seed"
  examples?: string[]
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

class AnzsicMappingModel {
  private collectionName = "anzsic_mappings"

  async getCollection() {
    const { db } = await connectToDatabase()
    return db.collection(this.collectionName)
  }

  async create(mappingData: Omit<AnzsicMapping, "_id">): Promise<AnzsicMapping> {
    const collection = await this.getCollection()

    const mapping: AnzsicMapping = {
      ...mappingData,
      anzsicCode: mappingData.anzsicCode.toString().padStart(4, "0"),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      examples: mappingData.examples || [],
    }

    // Check for existing mapping
    const existing = await collection.findOne({
      anzsicCode: mapping.anzsicCode,
      isActive: true,
    })

    if (existing) {
      console.log(`⚠️ ANZSIC mapping already exists: ${mapping.anzsicCode}`)
      return existing as AnzsicMapping
    }

    const result = await collection.insertOne(mapping)
    console.log(
      `✅ Created ANZSIC mapping: ${mapping.anzsicCode} -> ${mapping.atoCategory} (deductible: ${mapping.isDeductible})`,
    )
    return { ...mapping, _id: result.insertedId }
  }

  async bulkCreate(mappings: Array<Omit<AnzsicMapping, "_id">>): Promise<number> {
    if (mappings.length === 0) return 0

    const collection = await this.getCollection()

    const mappingsWithDefaults = mappings.map((mapping) => ({
      ...mapping,
      anzsicCode: mapping.anzsicCode.toString().padStart(4, "0"),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      examples: mapping.examples || [],
    }))

    try {
      const result = await collection.insertMany(mappingsWithDefaults, { ordered: false })
      console.log(`✅ Bulk created ${result.insertedCount} ANZSIC mappings`)
      return result.insertedCount
    } catch (error: any) {
      if (error.code === 11000) {
        console.log("Some ANZSIC mappings already exist, skipping duplicates")
        return error.result?.insertedCount || 0
      }
      throw error
    }
  }

  async findByAnzsicCode(anzsicCode: string): Promise<AnzsicMapping | null> {
    const collection = await this.getCollection()
    const formattedCode = anzsicCode.toString().padStart(4, "0")

    const result = (await collection.findOne({
      anzsicCode: formattedCode,
      isActive: true,
    })) as AnzsicMapping | null

    if (result) {
      console.log(
        `✅ Found ANZSIC mapping: ${result.anzsicCode} -> ${result.atoCategory} (deductible: ${result.isDeductible})`,
      )
    }

    return result
  }

  async findById(id: string): Promise<AnzsicMapping | null> {
    const collection = await this.getCollection()
    return (await collection.findOne({
      _id: new ObjectId(id),
      isActive: true,
    })) as AnzsicMapping | null
  }

  async getAll(): Promise<AnzsicMapping[]> {
    const collection = await this.getCollection()
    return (await collection.find({ isActive: true }).sort({ anzsicCode: 1 }).toArray()) as AnzsicMapping[]
  }

  async getDeductibleMappings(): Promise<AnzsicMapping[]> {
    const collection = await this.getCollection()
    return (await collection
      .find({
        isActive: true,
        isDeductible: true,
      })
      .sort({ atoCategory: 1 })
      .toArray()) as AnzsicMapping[]
  }

  async findDeductible(): Promise<AnzsicMapping[]> {
    return this.getDeductibleMappings()
  }

  async findByAtoCategory(atoCategory: string): Promise<AnzsicMapping[]> {
    const collection = await this.getCollection()
    return (await collection
      .find({
        atoCategory,
        isActive: true,
      })
      .toArray()) as AnzsicMapping[]
  }

  async search(query: string, limit = 20): Promise<AnzsicMapping[]> {
    const collection = await this.getCollection()

    const searchRegex = new RegExp(query, "i")

    return (await collection
      .find({
        isActive: true,
        $or: [{ anzsicCode: searchRegex }, { anzsicDescription: searchRegex }, { atoCategory: searchRegex }],
      })
      .limit(limit)
      .sort({ anzsicCode: 1 })
      .toArray()) as AnzsicMapping[]
  }

  async bulkFindByCodes(anzsicCodes: string[]): Promise<Map<string, AnzsicMapping>> {
    const collection = await this.getCollection()

    const formattedCodes = anzsicCodes.map((code) => code.toString().padStart(4, "0"))

    const mappings = (await collection
      .find({
        anzsicCode: { $in: formattedCodes },
        isActive: true,
      })
      .toArray()) as AnzsicMapping[]

    const mappingMap = new Map<string, AnzsicMapping>()
    mappings.forEach((mapping) => {
      mappingMap.set(mapping.anzsicCode, mapping)
    })

    return mappingMap
  }

  async update(id: string, updateData: Partial<AnzsicMapping>): Promise<boolean> {
    const collection = await this.getCollection()

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    )

    return result.modifiedCount > 0
  }

  async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection()

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      },
    )

    return result.modifiedCount > 0
  }

  async count(): Promise<number> {
    const collection = await this.getCollection()
    return await collection.countDocuments({ isActive: true })
  }

  async getStatistics(): Promise<{
    total: number
    deductible: number
    byAtoCategory: Array<{ category: string; count: number; deductible: number }>
    averageConfidence: number
  }> {
    const collection = await this.getCollection()

    const [total, deductible, byCategory, avgConfidence] = await Promise.all([
      collection.countDocuments({ isActive: true }),

      collection.countDocuments({ isActive: true, isDeductible: true }),

      collection
        .aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: "$atoCategory",
              count: { $sum: 1 },
              deductible: { $sum: { $cond: ["$isDeductible", 1, 0] } },
            },
          },
          { $sort: { count: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, avgConfidence: { $avg: "$confidenceLevel" } } },
        ])
        .toArray(),
    ])

    return {
      total,
      deductible,
      byAtoCategory: byCategory.map((item: any) => ({
        category: item._id,
        count: item.count,
        deductible: item.deductible,
      })),
      averageConfidence: avgConfidence[0]?.avgConfidence || 0,
    }
  }

  async createIndexes(): Promise<void> {
    const collection = await this.getCollection()

    await Promise.all([
      collection.createIndex({ anzsicCode: 1 }, { unique: true }),
      collection.createIndex({ atoCategory: 1 }),
      collection.createIndex({ isDeductible: 1 }),
      collection.createIndex({ isActive: 1 }),
      collection.createIndex({ source: 1 }),
      collection.createIndex({ confidenceLevel: -1 }),
      collection.createIndex({ createdAt: -1 }),
    ])
  }
}

export const anzsicMappingModel = new AnzsicMappingModel()
