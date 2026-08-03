import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { db } from "~/db";
import { licenseTable, productTable } from "~/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminOrRedirect();

    const body = await request.json();
    const { productCode, productName, licenseName, years, assigneeName, notes, assignToProduct, productId } = body;

    if (!productCode || !productName || !licenseName || !years) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (assignToProduct && !productId) {
      return NextResponse.json(
        { error: "Product ID is required when assigning to product" },
        { status: 400 }
      );
    }

    // tính ngày hết hạn
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + parseInt(years));
    const expiryDateStr = expiryDate.toISOString().split('T')[0];

    // gọi API ckey.run để generate license
    const response = await fetch('https://ckey.run/generateLicense/file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        assigneeName: assigneeName || "",
        expiryDate: expiryDateStr,
        licenseName: licenseName,
        productCode: productCode
      })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    // lấy license key
    let licenseKey = await response.text();
    
    // clean BOM, null bytes và ký tự lạ
    licenseKey = licenseKey
      .replace(/^\uFEFF/, '') // remove BOM
      .replace(/\0/g, '') // remove null bytes
      .replace(/\x00/g, '') // remove hex null bytes
      .trim();

    // lưu vào database
    const licenseId = nanoid();
    const [newLicense] = await db.insert(licenseTable).values({
      id: licenseId,
      productCode,
      productName,
      licenseName,
      licenseKey,
      userId: user.id,
      assigneeName: assigneeName || null,
      expiryDate,
      duration: parseInt(years),
      status: "active",
      isUsed: false,
      notes: notes || null,
    }).returning();

    // nếu được chọn, thêm license key vào product pool
    if (assignToProduct && productId) {
      try {
        const [product] = await db
          .select()
          .from(productTable)
          .where(eq(productTable.id, productId))
          .limit(1);

        if (product) {
          const currentCredentials = (product.accountCredentials as string[]) || [];
          const updatedCredentials = [...currentCredentials, licenseKey];

          await db
            .update(productTable)
            .set({
              accountCredentials: updatedCredentials,
              stockQuantity: updatedCredentials.length,
              inStock: updatedCredentials.length > 0,
              updatedAt: new Date(),
            })
            .where(eq(productTable.id, productId));
        }
      } catch (error) {
        console.error("Failed to add license to product:", error);
        // không throw error, vì license đã được tạo thành công
      }
    }

    return NextResponse.json({
      success: true,
      license: newLicense,
      licenseKey,
    });

  } catch (error) {
    console.error('Error generating license:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate license',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 