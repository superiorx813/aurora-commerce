import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";


// ---------------------------------------------------------
// GET /api/admin/products
//
// Returns products for the admin product management page.
// Only ADMIN users are allowed.
// ---------------------------------------------------------

export async function GET() {
    try {
        // -------------------------------------------------
        // Check logged-in user
        // -------------------------------------------------

        const user = await getSession();

        if (!user) {
            return NextResponse.json(
                {
                    error: "Authentication required."
                },
                {
                    status: 401
                }
            );
        }


        // -------------------------------------------------
        // Check admin role
        // -------------------------------------------------

        if (user.role !== "ADMIN") {
            return NextResponse.json(
                {
                    error: "Admin access required."
                },
                {
                    status: 403
                }
            );
        }


        // -------------------------------------------------
        // Fetch products
        // -------------------------------------------------

        const [rows] = await db.query(`
            SELECT
                p.id,
                p.category_id,
                p.product_type,
                p.name,
                p.slug,
                p.sku,
                p.short_description,
                p.description,
                p.price,
                p.mrp,
                p.stock,
                p.rating,
                p.review_count,
                p.brand,
                p.image_url,
                p.gallery_json,
                p.featured,
                p.status,
                p.created_at,
                p.updated_at,

                c.name AS category_name,
                c.slug AS category_slug

            FROM products p

            LEFT JOIN categories c
                ON c.id = p.category_id

            ORDER BY p.created_at DESC
        `);


        // -------------------------------------------------
        // Return products
        // -------------------------------------------------

        return NextResponse.json({
            products: rows
        });

    } catch (error) {

        console.error(
            "ADMIN PRODUCTS GET ERROR:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to load products."
            },
            {
                status: 500
            }
        );
    }
}


// ---------------------------------------------------------
// POST /api/admin/products
//
// Creates a new product.
// Only ADMIN users are allowed.
// ---------------------------------------------------------

export async function POST(request: Request) {
    try {

        // -------------------------------------------------
        // Check logged-in user
        // -------------------------------------------------

        const user = await getSession();

        if (!user) {
            return NextResponse.json(
                {
                    error: "Authentication required."
                },
                {
                    status: 401
                }
            );
        }


        // -------------------------------------------------
        // Check admin role
        // -------------------------------------------------

        if (user.role !== "ADMIN") {
            return NextResponse.json(
                {
                    error: "Admin access required."
                },
                {
                    status: 403
                }
            );
        }


        // -------------------------------------------------
        // Read request body
        // -------------------------------------------------

        const body = await request.json();


        // -------------------------------------------------
        // Extract product information
        // -------------------------------------------------

        const {
            category_id,
            product_type,
            name,
            slug,
            sku,
            short_description,
            description,
            price,
            mrp,
            stock,
            brand,
            image_url,
            gallery_json,
            featured,
            status
        } = body;


        // -------------------------------------------------
        // Basic validation
        // -------------------------------------------------

        if (!name || !String(name).trim()) {
            return NextResponse.json(
                {
                    error: "Product name is required."
                },
                {
                    status: 400
                }
            );
        }


        if (!slug || !String(slug).trim()) {
            return NextResponse.json(
                {
                    error: "Product slug is required."
                },
                {
                    status: 400
                }
            );
        }


        if (price === undefined || price === null || price === "") {
            return NextResponse.json(
                {
                    error: "Selling price is required."
                },
                {
                    status: 400
                }
            );
        }


        if (mrp === undefined || mrp === null || mrp === "") {
            return NextResponse.json(
                {
                    error: "MRP is required."
                },
                {
                    status: 400
                }
            );
        }


        // -------------------------------------------------
        // Convert numeric values
        // -------------------------------------------------

        const numericPrice = Number(price);
        const numericMrp = Number(mrp);

        const numericStock =
            stock === undefined ||
            stock === null ||
            stock === ""
                ? 0
                : Number(stock);


        // -------------------------------------------------
        // Validate numbers
        // -------------------------------------------------

        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            return NextResponse.json(
                {
                    error: "Selling price must be a valid positive number."
                },
                {
                    status: 400
                }
            );
        }


        if (!Number.isFinite(numericMrp) || numericMrp < 0) {
            return NextResponse.json(
                {
                    error: "MRP must be a valid positive number."
                },
                {
                    status: 400
                }
            );
        }


        if (numericMrp < numericPrice) {
            return NextResponse.json(
                {
                    error: "MRP cannot be lower than the selling price."
                },
                {
                    status: 400
                }
            );
        }


        if (!Number.isInteger(numericStock) || numericStock < 0) {
            return NextResponse.json(
                {
                    error: "Stock must be a valid whole number."
                },
                {
                    status: 400
                }
            );
        }


        // -------------------------------------------------
        // Check SKU
        // -------------------------------------------------

        const cleanSku =
            sku && String(sku).trim()
                ? String(sku).trim()
                : null;


        if (cleanSku) {

            const [existingSku] = await db.execute(
                `
                    SELECT id
                    FROM products
                    WHERE sku = ?
                    LIMIT 1
                `,
                [cleanSku]
            );


            if ((existingSku as any[]).length > 0) {
                return NextResponse.json(
                    {
                        error: "A product with this SKU already exists."
                    },
                    {
                        status: 409
                    }
                );
            }
        }


        // -------------------------------------------------
        // Clean slug
        // -------------------------------------------------

        const cleanSlug = String(slug)
            .trim()
            .toLowerCase();


        // -------------------------------------------------
        // Check slug
        // -------------------------------------------------

        const [existingSlug] = await db.execute(
            `
                SELECT id
                FROM products
                WHERE slug = ?
                LIMIT 1
            `,
            [cleanSlug]
        );


        if ((existingSlug as any[]).length > 0) {
            return NextResponse.json(
                {
                    error: "A product with this slug already exists."
                },
                {
                    status: 409
                }
            );
        }


        // -------------------------------------------------
        // Prepare optional values
        //
        // MySQL2 does not accept undefined.
        // Use null for empty database values.
        // -------------------------------------------------

        const cleanCategoryId =
            category_id === undefined ||
            category_id === null ||
            category_id === ""
                ? null
                : Number(category_id);


        const cleanProductType =
            product_type && String(product_type).trim()
                ? String(product_type).trim()
                : null;


        const cleanShortDescription =
            short_description &&
            String(short_description).trim()
                ? String(short_description).trim()
                : null;


        const cleanDescription =
            description &&
            String(description).trim()
                ? String(description).trim()
                : null;


        const cleanBrand =
            brand && String(brand).trim()
                ? String(brand).trim()
                : null;


        const cleanImageUrl =
            image_url && String(image_url).trim()
                ? String(image_url).trim()
                : null;


        const cleanGalleryJson =
            gallery_json === undefined ||
            gallery_json === null ||
            gallery_json === ""
                ? null
                : gallery_json;


        const cleanFeatured =
            featured === true ||
            featured === 1 ||
            featured === "1"
                ? 1
                : 0;


        const cleanStatus =
            status === "ACTIVE" ||
            status === "ARCHIVED"
                ? status
                : "DRAFT";


        // -------------------------------------------------
        // Insert product
        // -------------------------------------------------

        const [result] = await db.execute(
            `
                INSERT INTO products (
                    category_id,
                    product_type,
                    name,
                    slug,
                    sku,
                    short_description,
                    description,
                    price,
                    mrp,
                    stock,
                    rating,
                    review_count,
                    brand,
                    image_url,
                    gallery_json,
                    featured,
                    status
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
            `,
            [
                cleanCategoryId,
                cleanProductType,
                String(name).trim(),
                cleanSlug,
                cleanSku,
                cleanShortDescription,
                cleanDescription,
                numericPrice,
                numericMrp,
                numericStock,
                0,
                0,
                cleanBrand,
                cleanImageUrl,
                cleanGalleryJson,
                cleanFeatured,
                cleanStatus
            ]
        );


        // -------------------------------------------------
        // Get newly-created product ID
        // -------------------------------------------------

        const productId = (result as any).insertId;


        // -------------------------------------------------
        // Return success
        // -------------------------------------------------

        return NextResponse.json(
            {
                success: true,
                message: "Product created successfully.",
                productId
            },
            {
                status: 201
            }
        );

    } catch (error: any) {

        console.error(
            "ADMIN PRODUCTS POST ERROR:",
            error
        );


        // -------------------------------------------------
        // Handle duplicate database errors
        // -------------------------------------------------

        if (error?.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                {
                    error: "A product with the same unique value already exists."
                },
                {
                    status: 409
                }
            );
        }


        // -------------------------------------------------
        // Generic error
        // -------------------------------------------------

        return NextResponse.json(
            {
                error: "Failed to create product."
            },
            {
                status: 500
            }
        );
    }
}