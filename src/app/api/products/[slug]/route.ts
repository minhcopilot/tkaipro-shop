import { NextResponse } from "next/server";
import { getProductById, getProductBySlug } from "~/lib/queries/products";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json(
        { error: "Product slug is required" },
        { status: 400 }
      );
    }

    // lấy product theo slug
    const product = await getProductBySlug(slug);
    
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // chỉ trả về nếu product active
    if (product.status !== "active") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const transformedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      categorySlug: (product as any).categoryInfo?.slug || "",
      productType: product.productType || "account",
      upgradeEmailOnly: (product as any).upgradeEmailOnly ?? false,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      images: product.images,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity,
      isPopular: product.isPopular,
      isFeatured: product.isFeatured,
      rating: product.rating,
      reviewCount: product.reviewCount,
      purchaseCount: (product as any).salesCount ?? 0,
      features: product.features,
      specs: product.specs,
      tags: product.tags,
      nameLocales: product.nameLocales,
      descriptionLocales: product.descriptionLocales,
      shortDescriptionLocales: product.shortDescriptionLocales,
      featuresLocales: product.featuresLocales,
      availableAccounts: product.accountCredentials?.length || 0,
    };

    // "Upgrade option": nếu sản phẩm liên kết tới một sản phẩm upgrade ẩn và
    // sản phẩm đó còn active, trả kèm thông tin để trang chi tiết render lựa chọn
    // "Nâng cấp chính chủ" (giá riêng). Không trả khi không có link hoặc inactive.
    const linkedUpgradeId = (product as any).linkedUpgradeProductId as string | null | undefined;
    if (linkedUpgradeId) {
      const upgradeProduct = await getProductById(linkedUpgradeId);
      if (upgradeProduct && upgradeProduct.status === "active") {
        (transformedProduct as any).upgradeOption = {
          id: upgradeProduct.id,
          slug: upgradeProduct.slug,
          name: upgradeProduct.name,
          nameLocales: upgradeProduct.nameLocales,
          price: upgradeProduct.price,
          originalPrice: upgradeProduct.originalPrice,
          upgradeEmailOnly: upgradeProduct.upgradeEmailOnly ?? false,
        };
      }
    }

    return NextResponse.json(transformedProduct);

  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 