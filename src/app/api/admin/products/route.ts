import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentAdminOrRedirect } from "~/lib/auth";
import { 
  getAllProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  updateProductStatus,
  getAllCategories
} from "~/lib/queries/products";

// lấy danh sách products với filter và pagination
export async function GET(request: NextRequest) {
  try {
    // kiểm tra quyền admin
    await getCurrentAdminOrRedirect();

    const { searchParams } = new URL(request.url);
    
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const sortBy = searchParams.get("sortBy") as any || "createdAt";
    const sortOrder = searchParams.get("sortOrder") as any || "desc";
    
    // filters
    const filters = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      inStock: searchParams.get("inStock") ? searchParams.get("inStock") === "true" : undefined,
      isPopular: searchParams.get("isPopular") ? searchParams.get("isPopular") === "true" : undefined,
      isFeatured: searchParams.get("isFeatured") ? searchParams.get("isFeatured") === "true" : undefined,
      priceMin: searchParams.get("priceMin") ? Number(searchParams.get("priceMin")) : undefined,
      priceMax: searchParams.get("priceMax") ? Number(searchParams.get("priceMax")) : undefined,
    };

    // cho phép admin xem sản phẩm đã xóa
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const result = await getAllProducts({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      includeDeleted,
      // Admin luôn thấy cả sản phẩm ẩn (linked upgrade option) để quản lý.
      includeHidden: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// tạo product mới
export async function POST(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const body = await request.json() as any;
    
    // validate required fields
    if (!body.name || !body.category || !body.price) {
      return NextResponse.json(
        { error: "Name, category, and price are required" },
        { status: 400 }
      );
    }

    // chuyển category slug thành category ID
    const categories = await getAllCategories();
    const category = categories.find(c => c.slug === body.category || c.id === body.category);
    
    if (!category) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const newProduct = await createProduct({
      ...body,
      category: category.id, // lưu category ID thay vì slug
    });

    if (!newProduct) {
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

// cập nhật product
export async function PUT(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const body = await request.json() as any;
    const { productId, ...updateData } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // nếu có category, chuyển slug thành ID
    if (updateData.category) {
      const categories = await getAllCategories();
      const category = categories.find(c => c.slug === updateData.category || c.id === updateData.category);
      
      if (!category) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
      
      updateData.category = category.id; // lưu category ID thay vì slug
    }

    const updatedProduct = await updateProduct(productId, updateData);

    if (!updatedProduct) {
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// xóa product
export async function DELETE(request: NextRequest) {
  try {
    await getCurrentAdminOrRedirect();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteProduct(productId);

    if (!result.success) {
      const statusCode = result.code === "HAS_SUBSCRIPTIONS" ? 409 : 
                         result.code === "NOT_FOUND" ? 404 : 500;
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
} 