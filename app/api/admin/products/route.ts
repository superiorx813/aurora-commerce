import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";


// =========================================================
// GET /api/admin/products
// Get all admin products
// =========================================================

export async function GET() {

    try {

        // -------------------------------------------------
        // Authentication
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
        // Admin authorization
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
        // Success
        // -------------------------------------------------

        return NextResponse.json(
            {
                success: true,
                products: rows
            },
            {
                status: 200
            }
        );


    } catch (error) {

        console.error(
            "ADMIN PRODUCTS GET ERROR:",
            error
        );


        return NextResponse.json(
            {
                success: false,
                error: "Failed to load products."
            },
            {
                status: 500
            }
        );
    }
}



// =========================================================
// POST /api/admin/products
// Create a new product
// =========================================================

export async function POST(
    request: Request
) {

    let connection: any = null;


    try {

        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        const user = await getSession();

        if (!user) {

            return NextResponse.json(
                {
                    success: false,
                    error: "Authentication required."
                },
                {
                    status: 401
                }
            );
        }


        // -------------------------------------------------
        // Admin authorization
        // -------------------------------------------------

        if (user.role !== "ADMIN") {

            return NextResponse.json(
                {
                    success: false,
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


        /*
         * Supported frontend structure:
         *
         * {
         *     form: {...},
         *     image_url: "...",
         *     gallery_urls: [...],
         *     specifications: [...]
         * }
         *
         * We also support direct form submission.
         */

        const form =
            body?.form ||
            body ||
            {};


        // -------------------------------------------------
        // Additional product data
        // -------------------------------------------------

        const imageUrl =
            body?.image_url ||
            form?.image_url ||
            null;


        const galleryUrls =
            Array.isArray(body?.gallery_urls)
                ? body.gallery_urls
                : Array.isArray(form?.gallery_urls)
                    ? form.gallery_urls
                    : [];


        const specifications =
            Array.isArray(body?.specifications)
                ? body.specifications
                : Array.isArray(form?.specifications)
                    ? form.specifications
                    : [];


        // -------------------------------------------------
        // Extract fields
        // -------------------------------------------------

        const categoryId =
            form.category_id;


        const productType =
            form.product_type;


        const name =
            form.name;


        const brand =
            form.brand;


        const description =
            form.description;


        const shortDescription =
            form.short_description;


        const sku =
            form.sku;


        const price =
            form.price;


        const mrp =
            form.mrp;


        const stock =
            form.stock;


        const featured =
            form.featured;


        const status =
            form.status;


        // =================================================
        // VALIDATION
        // =================================================

        // -------------------------------------------------
        // Product name
        // -------------------------------------------------

        if (
            name === undefined ||
            name === null ||
            !String(name).trim()
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error: "Product name is required."
                },
                {
                    status: 400
                }
            );
        }


        // -------------------------------------------------
        // Generate base slug
        // -------------------------------------------------

        const baseSlug =
            String(name)
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");


        if (!baseSlug) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Unable to generate product slug."
                },
                {
                    status: 400
                }
            );
        }


        // -------------------------------------------------
        // Selling price
        // -------------------------------------------------

        if (
            price === undefined ||
            price === null ||
            price === ""
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Selling price is required."
                },
                {
                    status: 400
                }
            );
        }


        // -------------------------------------------------
        // MRP
        // -------------------------------------------------

        if (
            mrp === undefined ||
            mrp === null ||
            mrp === ""
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "MRP is required."
                },
                {
                    status: 400
                }
            );
        }


        // =================================================
        // NUMBER CONVERSION
        // =================================================

        const numericPrice =
            Number(price);


        const numericMrp =
            Number(mrp);


        const numericStock =
            stock === undefined ||
            stock === null ||
            stock === ""
                ? 0
                : Number(stock);


        // =================================================
        // NUMBER VALIDATION
        // =================================================

        if (
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Selling price must be a valid number."
                },
                {
                    status: 400
                }
            );
        }


        if (
            !Number.isFinite(numericMrp) ||
            numericMrp < 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "MRP must be a valid number."
                },
                {
                    status: 400
                }
            );
        }


        if (numericMrp < numericPrice) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "MRP cannot be lower than the selling price."
                },
                {
                    status: 400
                }
            );
        }


        if (
            !Number.isInteger(numericStock) ||
            numericStock < 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Stock must be a valid whole number."
                },
                {
                    status: 400
                }
            );
        }


        // =================================================
        // CLEAN OPTIONAL VALUES
        // =================================================

        const cleanCategoryId =
            categoryId === undefined ||
            categoryId === null ||
            categoryId === ""
                ? null
                : Number(categoryId);


        if (
            cleanCategoryId !== null &&
            (
                !Number.isInteger(cleanCategoryId) ||
                cleanCategoryId <= 0
            )
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invalid category selected."
                },
                {
                    status: 400
                }
            );
        }


        const cleanProductType =
            productType &&
            String(productType).trim()
                ? String(productType).trim()
                : null;


        const cleanBrand =
            brand &&
            String(brand).trim()
                ? String(brand).trim()
                : null;


        const cleanDescription =
            description &&
            String(description).trim()
                ? String(description).trim()
                : null;


        const cleanShortDescription =
            shortDescription &&
            String(shortDescription).trim()
                ? String(shortDescription).trim()
                : null;


        const cleanSku =
            sku &&
            String(sku).trim()
                ? String(sku).trim()
                : null;


        const cleanImageUrl =
            imageUrl &&
            String(imageUrl).trim()
                ? String(imageUrl).trim()
                : null;


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


        // =================================================
        // UNIQUE SLUG
        // =================================================

        let finalSlug =
            baseSlug;


        let slugCounter =
            2;


        while (true) {

            const [existingSlug] =
                await db.execute(
                    `
                        SELECT id
                        FROM products
                        WHERE slug = ?
                        LIMIT 1
                    `,
                    [finalSlug]
                );


            if (
                (existingSlug as any[]).length === 0
            ) {

                break;
            }


            finalSlug =
                `${baseSlug}-${slugCounter}`;


            slugCounter++;
        }


        // =================================================
        // UNIQUE SKU
        // =================================================

        if (cleanSku) {

            const [existingSku] =
                await db.execute(
                    `
                        SELECT id
                        FROM products
                        WHERE sku = ?
                        LIMIT 1
                    `,
                    [cleanSku]
                );


            if (
                (existingSku as any[]).length > 0
            ) {

                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "A product with this SKU already exists."
                    },
                    {
                        status: 409
                    }
                );
            }
        }


        // =================================================
        // DATABASE CONNECTION
        // =================================================

        connection =
            await db.getConnection();


        // =================================================
        // TRANSACTION
        // =================================================

        await connection.beginTransaction();


        // =================================================
        // GALLERY JSON
        // =================================================

        const validGalleryUrls =
            galleryUrls
                .filter(
                    (url: unknown) =>
                        url !== null &&
                        url !== undefined &&
                        String(url).trim()
                )
                .map(
                    (url: unknown) =>
                        String(url).trim()
                );


        const galleryJson =
            validGalleryUrls.length > 0
                ? JSON.stringify(validGalleryUrls)
                : null;


        // =================================================
        // INSERT PRODUCT
        // =================================================

        const [productResult] =
            await connection.execute(
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
                    finalSlug,
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
                    galleryJson,
                    cleanFeatured,
                    cleanStatus
                ]
            );


        const productId =
            (productResult as any).insertId;


        // =================================================
        // PRODUCT GALLERY
        // =================================================

        if (
            validGalleryUrls.length > 0
        ) {

            for (
                let index = 0;
                index < validGalleryUrls.length;
                index++
            ) {

                const url =
                    validGalleryUrls[index];


                await connection.execute(
                    `
                        INSERT INTO product_images (
                            product_id,
                            image_url,
                            alt_text,
                            sort_order,
                            is_primary
                        )
                        VALUES (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?
                        )
                    `,
                    [
                        productId,
                        url,
                        String(name).trim(),
                        index,
                        index === 0 ? 1 : 0
                    ]
                );
            }
        }


        // =================================================
        // SHIPPING
        // =================================================

        const weight =
            form.weight === "" ||
            form.weight === undefined ||
            form.weight === null
                ? null
                : Number(form.weight);


        const length =
            form.length === "" ||
            form.length === undefined ||
            form.length === null
                ? null
                : Number(form.length);


        const width =
            form.width === "" ||
            form.width === undefined ||
            form.width === null
                ? null
                : Number(form.width);


        const height =
            form.height === "" ||
            form.height === undefined ||
            form.height === null
                ? null
                : Number(form.height);


        const freeShipping =
            form.free_shipping === true ||
            form.free_shipping === 1 ||
            form.free_shipping === "1"
                ? 1
                : 0;


        const codAvailable =
            form.cod_available === false ||
            form.cod_available === 0 ||
            form.cod_available === "0"
                ? 0
                : 1;


        const returnAvailable =
            form.return_available === false ||
            form.return_available === 0 ||
            form.return_available === "0"
                ? 0
                : 1;


        const returnDays =
            form.return_days === "" ||
            form.return_days === undefined ||
            form.return_days === null
                ? 7
                : Number(form.return_days);


        await connection.execute(
            `
                INSERT INTO product_shipping (
                    product_id,
                    weight,
                    length,
                    width,
                    height,
                    free_shipping,
                    cod_available,
                    return_available,
                    return_days
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
                    ?
                )
            `,
            [
                productId,
                weight,
                length,
                width,
                height,
                freeShipping,
                codAvailable,
                returnAvailable,
                returnDays
            ]
        );


        // =================================================
        // SPECIFICATIONS
        // =================================================

        if (
            specifications.length > 0
        ) {

            let sortOrder =
                0;


            for (
                const specification of specifications
            ) {

                const group =
                    specification?.specification_group;


                const key =
                    specification?.specification_key;


                const value =
                    specification?.specification_value;


                if (
                    !key ||
                    !String(key).trim()
                ) {

                    continue;
                }


                await connection.execute(
                    `
                        INSERT INTO product_specifications (
                            product_id,
                            specification_group,
                            specification_key,
                            specification_value,
                            sort_order
                        )
                        VALUES (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?
                        )
                    `,
                    [
                        productId,

                        group &&
                        String(group).trim()
                            ? String(group).trim()
                            : null,

                        String(key).trim(),

                        value === undefined ||
                        value === null ||
                        value === ""
                            ? null
                            : String(value),

                        sortOrder
                    ]
                );


                sortOrder++;
            }
        }


        // =================================================
        // SEO
        // =================================================

        const seoTitle =
            form.seo_title &&
            String(form.seo_title).trim()
                ? String(form.seo_title).trim()
                : null;


        const metaDescription =
            form.meta_description &&
            String(form.meta_description).trim()
                ? String(form.meta_description).trim()
                : null;


        const seoKeywords =
            form.seo_keywords &&
            String(form.seo_keywords).trim()
                ? String(form.seo_keywords).trim()
                : null;


        const canonicalUrl =
            form.canonical_url &&
            String(form.canonical_url).trim()
                ? String(form.canonical_url).trim()
                : null;


        await connection.execute(
            `
                INSERT INTO product_seo (
                    product_id,
                    seo_title,
                    meta_description,
                    seo_keywords,
                    canonical_url
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
            `,
            [
                productId,
                seoTitle,
                metaDescription,
                seoKeywords,
                canonicalUrl
            ]
        );


        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();


        // =================================================
        // SUCCESS
        // =================================================

        return NextResponse.json(
            {
                success: true,
                message:
                    "Product created successfully.",
                productId,
                slug: finalSlug
            },
            {
                status: 201
            }
        );


    } catch (error: any) {

        // -------------------------------------------------
        // Rollback
        // -------------------------------------------------

        if (connection) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    "PRODUCT CREATE ROLLBACK ERROR:",
                    rollbackError
                );
            }
        }


        console.error(
            "ADMIN PRODUCTS POST ERROR:",
            error
        );


        // -------------------------------------------------
        // Duplicate
        // -------------------------------------------------

        if (
            error?.code ===
            "ER_DUP_ENTRY"
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "A product with the same unique value already exists."
                },
                {
                    status: 409
                }
            );
        }


        // -------------------------------------------------
        // Unknown column
        // -------------------------------------------------

        if (
            error?.code ===
            "ER_BAD_FIELD_ERROR"
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        `Database column error: ${
                            error.sqlMessage ||
                            "Unknown column."
                        }`
                },
                {
                    status: 500
                }
            );
        }


        // -------------------------------------------------
        // Foreign key
        // -------------------------------------------------

        if (
            error?.code ===
            "ER_NO_REFERENCED_ROW_2"
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "The selected category does not exist."
                },
                {
                    status: 400
                }
            );
        }


        // -------------------------------------------------
        // Generic error
        // -------------------------------------------------

        return NextResponse.json(
            {
                success: false,
                error:
                    error?.message ||
                    "Failed to create product."
            },
            {
                status: 500
            }
        );


    } finally {

        if (connection) {
            connection.release();
        }
    }
}