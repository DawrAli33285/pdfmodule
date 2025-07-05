import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        {
          success: false,
          error: "Keyword is required",
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Received keyword lookup request for: "${keyword}"`);

    const client = await clientPromise;
    const dbName = "moulai-tax-app";
    const collectionName = "keyword_mappings";
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    console.log(`🗄️ Connected to database "${dbName}", collection "${collectionName}"`);

    // Normalize the keyword
    const normalizedKeyword = keyword.toLowerCase().trim();
    console.log(`🔧 Normalized keyword: "${normalizedKeyword}"`);
    console.log(
      `🔤 Char codes:`,
      normalizedKeyword.split("").map((c) => c.charCodeAt(0))
    );

    // Count documents
    const totalCount = await collection.countDocuments();
    console.log(`📊 Total documents in collection: ${totalCount}`);

    // Get a sample for sanity
    const sampleDocs = await collection
      .find({}, { projection: { keyword: 1, status: 1 } })
      .limit(5)
      .toArray();
    console.log(`📋 Sample keywords in collection:`, sampleDocs);

    // Exact match
    console.log(`🔍 Searching for exact match: { keyword: "${normalizedKeyword}" }`);
    const exactMatch = await collection.findOne({ keyword: normalizedKeyword });
    console.log(
      `📋 Exact match result:`,
      exactMatch ? `FOUND (id=${exactMatch._id})` : "NOT FOUND"
    );

    // Case-insensitive match
    const caseInsensitiveMatch = await collection.findOne({
      keyword: { $regex: `^${normalizedKeyword}$`, $options: "i" },
    });
    console.log(
      `📋 Case-insensitive match result:`,
      caseInsensitiveMatch ? `FOUND (id=${caseInsensitiveMatch._id})` : "NOT FOUND"
    );

    // Starts-with matches
    const startsWithMatches = await collection
      .find({
        keyword: { $regex: `^${normalizedKeyword}`, $options: "i" },
      })
      .limit(10)
      .toArray();
    console.log(
      `📋 Starts-with matches (${startsWithMatches.length}):`,
      startsWithMatches.map((m) => m.keyword)
    );

    // Contains matches
    const containsMatches = await collection
      .find({
        keyword: { $regex: normalizedKeyword, $options: "i" },
      })
      .limit(10)
      .toArray();
    console.log(
      `📋 Contains matches (${containsMatches.length}):`,
      containsMatches.map((m) => m.keyword)
    );

    const result = {
      searchTerm: keyword,
      normalizedKeyword,
      exactMatch: exactMatch
        ? {
            keyword: exactMatch.keyword,
            status: exactMatch.status,
            atoCategory: exactMatch.atoCategory,
            confidence: exactMatch.confidenceLevel,
            source: exactMatch.source,
          }
        : null,
      caseInsensitiveMatch: caseInsensitiveMatch
        ? {
            keyword: caseInsensitiveMatch.keyword,
            status: caseInsensitiveMatch.status,
            atoCategory: caseInsensitiveMatch.atoCategory,
            confidence: caseInsensitiveMatch.confidenceLevel,
            source: caseInsensitiveMatch.source,
          }
        : null,
      startsWithMatches: startsWithMatches.map((m) => ({
        keyword: m.keyword,
        status: m.status,
        atoCategory: m.atoCategory,
        confidence: m.confidenceLevel,
      })),
      containsMatches: containsMatches.map((m) => ({
        keyword: m.keyword,
        status: m.status,
        atoCategory: m.atoCategory,
        confidence: m.confidenceLevel,
      })),
      totalKeywordsInDB: totalCount,
      sampleKeywords: sampleDocs.map((k) => ({
        keyword: k.keyword,
        status: k.status,
      })),
    };

    console.log(`✅ Keyword lookup test summary:`, {
      exactMatch: !!result.exactMatch,
      caseInsensitiveMatch: !!result.caseInsensitiveMatch,
      startsWithMatches: result.startsWithMatches.length,
      containsMatches: result.containsMatches.length,
      totalInDB: result.totalKeywordsInDB,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("❌ Keyword lookup test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
