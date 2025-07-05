import { connectToDatabase } from "../mongodb"
import { ObjectId } from "mongodb"

export interface Merchant {
  _id?: ObjectId
  merchantName: string
  displayName: string
  anzsicCode: string
  keywords: string[]
  aliases: string[]
  source: "manual" | "ai" | "comprehensive-seed" | "user"
  confidence: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  usageCount?: number
  lastUsed?: Date
}

class MerchantModel {
  private collectionName = "merchants"

  async getCollection() {
    const { db } = await connectToDatabase()
    return db.collection(this.collectionName)
  }

  async create(merchantData: Omit<Merchant, "_id">): Promise<Merchant> {
    const collection = await this.getCollection()

    const merchant: Merchant = {
      ...merchantData,
      merchantName: merchantData.merchantName.toLowerCase().trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      usageCount: 0,
    }

    // Check for existing merchant
    const existing = await collection.findOne({
      merchantName: merchant.merchantName,
      isActive: true,
    })

    if (existing) {
      console.log(`⚠️ Merchant already exists: ${merchantData.displayName}`)
      return existing as Merchant
    }

    const result = await collection.insertOne(merchant)
    console.log(`✅ Created merchant: ${merchantData.displayName}`)
    return { ...merchant, _id: result.insertedId }
  }

  async bulkCreate(merchants: Array<Omit<Merchant, "_id">>): Promise<number> {
    if (merchants.length === 0) return 0

    const collection = await this.getCollection()

    const merchantsWithDefaults = merchants.map((merchant) => ({
      ...merchant,
      merchantName: merchant.merchantName.toLowerCase().trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      usageCount: 0,
    }))

    try {
      const result = await collection.insertMany(merchantsWithDefaults, { ordered: false })
      console.log(`✅ Bulk created ${result.insertedCount} merchants`)
      return result.insertedCount
    } catch (error: any) {
      if (error.code === 11000) {
        console.log("Some merchants already exist, skipping duplicates")
        return error.result?.insertedCount || 0
      }
      throw error
    }
  }

  async findByName(merchantName: string): Promise<Merchant | null> {
    const collection = await this.getCollection()
    return (await collection.findOne({
      merchantName: merchantName.toLowerCase().trim(),
      isActive: true,
    })) as Merchant | null
  }

  async findById(id: string): Promise<Merchant | null> {
    const collection = await this.getCollection()
    return (await collection.findOne({
      _id: new ObjectId(id),
      isActive: true,
    })) as Merchant | null
  }

  async search(query: string, limit = 20): Promise<Merchant[]> {
    const collection = await this.getCollection()

    const searchRegex = new RegExp(query, "i")

    return (await collection
      .find({
        isActive: true,
        $or: [
          { merchantName: searchRegex },
          { displayName: searchRegex },
          { keywords: { $in: [searchRegex] } },
          { aliases: { $in: [searchRegex] } },
        ],
      })
      .limit(limit)
      .sort({ usageCount: -1, displayName: 1 })
      .toArray()) as Merchant[]
  }

  async getAll(): Promise<Merchant[]> {
    const collection = await this.getCollection()
    return (await collection.find({ isActive: true }).sort({ displayName: 1 }).toArray()) as Merchant[]
  }

  async getAllWithAnzsicCode(anzsicCode: string): Promise<Merchant[]> {
    const collection = await this.getCollection()
    return (await collection
      .find({
        anzsicCode,
        isActive: true,
      })
      .toArray()) as Merchant[]
  }

  async bulkFindByKeywords(keywords: string[]): Promise<Map<string, Merchant>> {
    const collection = await this.getCollection()

    const merchants = (await collection
      .find({
        isActive: true,
        $or: [{ merchantName: { $in: keywords } }, { keywords: { $in: keywords } }, { aliases: { $in: keywords } }],
      })
      .toArray()) as Merchant[]

    const merchantMap = new Map<string, Merchant>()

    merchants.forEach((merchant) => {
      // Map by merchant name
      merchantMap.set(merchant.merchantName, merchant)

      // Map by keywords
      merchant.keywords.forEach((keyword) => {
        merchantMap.set(keyword.toLowerCase(), merchant)
      })

      // Map by aliases
      merchant.aliases.forEach((alias) => {
        merchantMap.set(alias.toLowerCase(), merchant)
      })
    })

    return merchantMap
  }

  async incrementUsage(merchantName: string): Promise<void> {
    const collection = await this.getCollection()
    await collection.updateOne(
      { merchantName: merchantName.toLowerCase().trim() },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsed: new Date() },
      },
    )
  }

  async update(id: string, updateData: Partial<Merchant>): Promise<boolean> {
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
    byAnzsicCode: Array<{ anzsicCode: string; count: number }>
    bySource: Array<{ source: string; count: number }>
    mostUsed: Array<{ merchantName: string; displayName: string; usageCount: number }>
  }> {
    const collection = await this.getCollection()

    const [total, byAnzsicCode, bySource, mostUsed] = await Promise.all([
      collection.countDocuments({ isActive: true }),

      collection
        .aggregate([
          { $match: { isActive: true } },
          { $group: { _id: "$anzsicCode", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: { isActive: true } },
          { $group: { _id: "$source", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),

      collection
        .find({ isActive: true })
        .sort({ usageCount: -1 })
        .limit(10)
        .project({ merchantName: 1, displayName: 1, usageCount: 1 })
        .toArray(),
    ])

    return {
      total,
      byAnzsicCode: byAnzsicCode.map((item: any) => ({
        anzsicCode: item._id,
        count: item.count,
      })),
      bySource: bySource.map((item: any) => ({
        source: item._id,
        count: item.count,
      })),
      mostUsed: mostUsed.map((item: any) => ({
        merchantName: item.merchantName,
        displayName: item.displayName,
        usageCount: item.usageCount || 0,
      })),
    }
  }

  async createIndexes(): Promise<void> {
    const collection = await this.getCollection()

    await Promise.all([
      collection.createIndex({ merchantName: 1 }, { unique: true }),
      collection.createIndex({ anzsicCode: 1 }),
      collection.createIndex({ keywords: 1 }),
      collection.createIndex({ aliases: 1 }),
      collection.createIndex({ isActive: 1 }),
      collection.createIndex({ source: 1 }),
      collection.createIndex({ usageCount: -1 }),
      collection.createIndex({ createdAt: -1 }),
    ])
  }
}

export const merchantModel = new MerchantModel()
