import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";


// =========================================================
// TYPES
// =========================================================

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};


type SpecificationInput = {
    specification_group?: string;
    specification_key?: string;
    specification_value?: string;
};


type ShippingInput = {
    weight?: number | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;

    free_shipping?: boolean;
    cod_available?: boolean;

    return_available?: boolean;
    return_days?: number | null;
};


type SeoInput = {
    seo_title?: string;
    meta_description?: string;
    seo_keywords?: string;
    canonical_url?: string;
};


// =========================================================
// HELPERS
// =========================================================

function toNumberOrNull(value: any): number | null {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}


function toBoolean(
    value: any,
    fallback = false
): boolean {

    if (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    ) {
        return true;
    }

    if (
        value === false ||
        value === 0 ||
        value === "0" ||
        value === "false"
    ) {
        return false;
    }

    return fallback;
}


function cleanString(
    value: any
): string {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
}


function createSlug(
    value: string
): string {

    return value
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9\s-]/g,
            ""
        )
        .replace(
            /\s+/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        );
}


// =========================================================
// PUT /api/admin/products/[id]
// UPDATE PRODUCT
// =========================================================

export async function PUT(
    request: Request,
    context: RouteContext
) {

    let connection: any = null;


    try {

        // =================================================
        // AUTHENTICATION
        // =================================================

        const user =
            await getSession();


        if (!user) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Authentication required."
                },
                {
                    status: 401
                }
            );

        }


        // =================================================
        // ADMIN AUTHORIZATION
        // =================================================

        if (
            user.role !== "ADMIN"
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Admin access required."
                },
                {
                    status: 403
                }
            );

        }


        // =================================================
        // GET PRODUCT ID
        // =================================================

        const params =
            await context.params;


        const productId =
            Number(params.id);


        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invalid product ID."
                },
                {
                    status: 400
                }
            );

        }


        // =================================================
        // READ REQUEST BODY
        // =================================================

        let body: any;

        try {

            body =
                await request.json();

        } catch {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invalid JSON request body."
                },
                {
                    status: 400
                }
            );

        }


        // =================================================
        // BASIC PRODUCT FIELDS
        // =================================================

        const name =
            cleanString(
                body.name
            );


        if (!name) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Product name is required."
                },
                {
                    status: 400
                }
            );

        }


        const brand =
            cleanString(
                body.brand
            );


        if (!brand) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Brand is required."
                },
                {
                    status: 400
                }
            );

        }


        const categoryId =
            toNumberOrNull(
                body.category_id
            );


        if (
            categoryId === null
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Category ID is required."
                },
                {
                    status: 400
                }
            );

        }


        const sku =
            cleanString(
                body.sku
            );


        if (!sku) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "SKU is required."
                },
                {
                    status: 400
                }
            );

        }


        const slug =
            cleanString(
                body.slug
            ) ||
            createSlug(name);


        const price =
            toNumberOrNull(
                body.price
            );


        const mrp =
            toNumberOrNull(
                body.mrp
            );


        const stock =
            toNumberOrNull(
                body.stock
            );


        if (
            price === null ||
            price <= 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Enter a valid selling price."
                },
                {
                    status: 400
                }
            );

        }


        if (
            mrp === null ||
            mrp <= 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Enter a valid MRP."
                },
                {
                    status: 400
                }
            );

        }


        if (
            price > mrp
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Selling price cannot be greater than MRP."
                },
                {
                    status: 400
                }
            );

        }


        if (
            stock === null ||
            !Number.isInteger(stock) ||
            stock < 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Enter a valid stock quantity."
                },
                {
                    status: 400
                }
            );

        }


        const productType =
            cleanString(
                body.product_type
            ) ||
            "other";


        const description =
            cleanString(
                body.description
            );


        const shortDescription =
            cleanString(
                body.short_description
            );


        const imageUrl =
            cleanString(
                body.image_url
            ) || null;


        const featured =
            toBoolean(
                body.featured,
                false
            );


        const status =
            body.status === "ACTIVE"
                ? "ACTIVE"
                : "DRAFT";


        // =================================================
        // GALLERY
        // =================================================

        let galleryUrls: string[] = [];


        if (
            Array.isArray(
                body.gallery_urls
            )
        ) {

            galleryUrls =
                body.gallery_urls
                    .map(
                        (url: any) =>
                            cleanString(url)
                    )
                    .filter(
                        (url: string) =>
                            url.length > 0
                    );

        } else if (
            Array.isArray(
                body.gallery_json
            )
        ) {

            galleryUrls =
                body.gallery_json
                    .map(
                        (url: any) =>
                            cleanString(url)
                    )
                    .filter(
                        (url: string) =>
                            url.length > 0
                    );

        } else if (
            typeof body.gallery_json ===
            "string"
        ) {

            try {

                const parsed =
                    JSON.parse(
                        body.gallery_json
                    );


                if (
                    Array.isArray(parsed)
                ) {

                    galleryUrls =
                        parsed
                            .map(
                                (url: any) =>
                                    cleanString(url)
                            )
                            .filter(
                                (url: string) =>
                                    url.length > 0
                            );

                }

            } catch {

                galleryUrls = [];

            }

        }


        const galleryJson =
            galleryUrls.length > 0
                ? JSON.stringify(
                    galleryUrls
                )
                : null;


        // =================================================
        // SPECIFICATIONS
        // =================================================

        const specifications:
            SpecificationInput[] =
            Array.isArray(
                body.specifications
            )
                ? body.specifications
                    .filter(
                        (item: any) =>
                            item &&
                            cleanString(
                                item.specification_key
                            )
                    )
                    .map(
                        (item: any) => ({
                            specification_group:
                                cleanString(
                                    item.specification_group
                                ) ||
                                "General",

                            specification_key:
                                cleanString(
                                    item.specification_key
                                ),

                            specification_value:
                                cleanString(
                                    item.specification_value
                                )
                        })
                    )
                : [];


        // =================================================
        // SHIPPING
        // =================================================

        const shipping:
            ShippingInput =
            body.shipping &&
            typeof body.shipping === "object"
                ? body.shipping
                : {};


        const weight =
            toNumberOrNull(
                shipping.weight
            );


        const length =
            toNumberOrNull(
                shipping.length
            );


        const width =
            toNumberOrNull(
                shipping.width
            );


        const height =
            toNumberOrNull(
                shipping.height
            );


        const freeShipping =
            toBoolean(
                shipping.free_shipping,
                false
            );


        const codAvailable =
            toBoolean(
                shipping.cod_available,
                true
            );


        const returnAvailable =
            toBoolean(
                shipping.return_available,
                true
            );


        const returnDaysValue =
            toNumberOrNull(
                shipping.return_days
            );


        const returnDays =
            returnDaysValue !== null &&
            returnDaysValue >= 0
                ? Math.floor(
                    returnDaysValue
                )
                : 7;


        // =================================================
        // SEO
        // =================================================

        const seo:
            SeoInput =
            body.seo &&
            typeof body.seo === "object"
                ? body.seo
                : {};


        const seoTitle =
            cleanString(
                seo.seo_title
            );


        const metaDescription =
            cleanString(
                seo.meta_description
            );


        const seoKeywords =
            cleanString(
                seo.seo_keywords
            );


        const canonicalUrl =
            cleanString(
                seo.canonical_url
            );


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
        // CHECK PRODUCT
        // =================================================

        const [
            existingRows
        ] =
            await connection.execute(
                `
                    SELECT
                        id,
                        name,
                        slug
                    FROM products
                    WHERE id = ?
                    LIMIT 1
                `,
                [
                    productId
                ]
            );


        const existingProducts =
            existingRows as any[];


        if (
            existingProducts.length === 0
        ) {

            await connection.rollback();


            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Product not found."
                },
                {
                    status: 404
                }
            );

        }


        // =================================================
        // CHECK SLUG DUPLICATE
        // =================================================

        const [
            slugRows
        ] =
            await connection.execute(
                `
                    SELECT id
                    FROM products
                    WHERE slug = ?
                    AND id <> ?
                    LIMIT 1
                `,
                [
                    slug,
                    productId
                ]
            );


        if (
            (slugRows as any[]).length > 0
        ) {

            await connection.rollback();


            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Another product already uses this slug."
                },
                {
                    status: 409
                }
            );

        }


        // =================================================
        // CHECK SKU DUPLICATE
        // =================================================

        /*
         * SKU may or may not exist in your current
         * products table.
         *
         * We therefore do not query it separately.
         *
         * If your table has a UNIQUE SKU constraint,
         * MySQL will return the appropriate error.
         */


        // =================================================
        // UPDATE MAIN PRODUCT
        // =================================================

        await connection.execute(
            `
                UPDATE products
                SET
                    category_id = ?,
                    product_type = ?,
                    name = ?,
                    slug = ?,
                    description = ?,
                    short_description = ?,
                    price = ?,
                    mrp = ?,
                    stock = ?,
                    brand = ?,
                    image_url = ?,
                    featured = ?,
                    status = ?,
                    sku = ?
                WHERE id = ?
            `,
            [
                categoryId,
                productType,
                name,
                slug,
                description || null,
                shortDescription || null,
                price,
                mrp,
                stock,
                brand,
                imageUrl,
                featured ? 1 : 0,
                status,
                sku,
                productId
            ]
        );


        // =================================================
        // UPDATE GALLERY
        // =================================================

        await connection.execute(
            `
                DELETE FROM product_images
                WHERE product_id = ?
            `,
            [
                productId
            ]
        );


        if (
            imageUrl ||
            galleryUrls.length > 0
        ) {

            const allImages =
                [
                    ...(imageUrl
                        ? [imageUrl]
                        : []),
                    ...galleryUrls
                        .filter(
                            url =>
                                url !== imageUrl
                        )
                ];


            for (
                let index = 0;
                index < allImages.length;
                index++
            ) {

                await connection.execute(
                    `
                        INSERT INTO product_images
                        (
                            product_id,
                            image_url,
                            alt_text,
                            sort_order,
                            is_primary
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        productId,
                        allImages[index],
                        name,
                        index,
                        index === 0
                            ? 1
                            : 0
                    ]
                );

            }

        }


        // =================================================
        // UPDATE SHIPPING
        // =================================================

        await connection.execute(
            `
                DELETE FROM product_shipping
                WHERE product_id = ?
            `,
            [
                productId
            ]
        );


        await connection.execute(
            `
                INSERT INTO product_shipping
                (
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
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                productId,
                weight,
                length,
                width,
                height,
                freeShipping ? 1 : 0,
                codAvailable ? 1 : 0,
                returnAvailable ? 1 : 0,
                returnDays
            ]
        );


        // =================================================
        // UPDATE SPECIFICATIONS
        // =================================================

        await connection.execute(
            `
                DELETE FROM product_specifications
                WHERE product_id = ?
            `,
            [
                productId
            ]
        );


        for (
            let index = 0;
            index < specifications.length;
            index++
        ) {

            const specification =
                specifications[index];


            if (
                !specification.specification_value ||
                !specification.specification_value.trim()
            ) {
                continue;
            }


            await connection.execute(
                `
                    INSERT INTO product_specifications
                    (
                        product_id,
                        specification_group,
                        specification_key,
                        specification_value,
                        sort_order
                    )
                    VALUES (?, ?, ?, ?, ?)
                `,
                [
                    productId,

                    specification.specification_group ||
                        "General",

                    specification.specification_key ||
                        "",

                    specification.specification_value ||
                        "",

                    index
                ]
            );

        }


        // =================================================
        // UPDATE SEO
        // =================================================

        await connection.execute(
            `
                DELETE FROM product_seo
                WHERE product_id = ?
            `,
            [
                productId
            ]
        );


        await connection.execute(
            `
                INSERT INTO product_seo
                (
                    product_id,
                    seo_title,
                    meta_description,
                    seo_keywords,
                    canonical_url
                )
                VALUES (?, ?, ?, ?, ?)
            `,
            [
                productId,
                seoTitle || null,
                metaDescription || null,
                seoKeywords || null,
                canonicalUrl || null
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
                    "Product updated successfully.",

                product: {
                    id: productId,
                    name,
                    slug,
                    product_type:
                        productType,
                    category_id:
                        categoryId,
                    sku,
                    price,
                    mrp,
                    stock,
                    brand,
                    image_url:
                        imageUrl,
                    featured,
                    status
                }
            },
            {
                status: 200
            }
        );


    } catch (error: any) {

        // =================================================
        // ROLLBACK
        // =================================================

        if (connection) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    "PRODUCT UPDATE ROLLBACK ERROR:",
                    rollbackError
                );

            }

        }


        console.error(
            "ADMIN PRODUCT UPDATE ERROR:",
            error
        );


        // =================================================
        // DUPLICATE ENTRY
        // =================================================

        if (
            error?.code ===
            "ER_DUP_ENTRY"
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "A product with the same SKU or another unique value already exists."
                },
                {
                    status: 409
                }
            );

        }


        // =================================================
        // FOREIGN KEY ERROR
        // =================================================

        if (
            error?.code ===
                "ER_NO_REFERENCED_ROW_2" ||
            error?.code ===
                "ER_ROW_IS_REFERENCED_2"
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        error.sqlMessage ||
                        "A related database record is invalid."
                },
                {
                    status: 409
                }
            );

        }


        // =================================================
        // TABLE DOES NOT EXIST
        // =================================================

        if (
            error?.code ===
            "ER_NO_SUCH_TABLE"
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        `Database table error: ${
                            error.sqlMessage ||
                            "A required product table does not exist."
                        }`
                },
                {
                    status: 500
                }
            );

        }


        // =================================================
        // UNKNOWN COLUMN
        // =================================================

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
                            "Unknown database column."
                        }`
                },
                {
                    status: 500
                }
            );

        }


        // =================================================
        // GENERIC ERROR
        // =================================================

        return NextResponse.json(
            {
                success: false,
                error:
                    error?.message ||
                    "Failed to update product."
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


// =========================================================
// DELETE /api/admin/products/[id]
// DELETE PRODUCT
// =========================================================

export async function DELETE(
    request: Request,
    context: RouteContext
) {

    let connection: any = null;


    try {

        // =================================================
        // AUTHENTICATION
        // =================================================

        const user =
            await getSession();


        if (!user) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Authentication required."
                },
                {
                    status: 401
                }
            );

        }


        // =================================================
        // ADMIN AUTHORIZATION
        // =================================================

        if (
            user.role !== "ADMIN"
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Admin access required."
                },
                {
                    status: 403
                }
            );

        }


        // =================================================
        // GET PRODUCT ID
        // =================================================

        const params =
            await context.params;


        const productId =
            Number(params.id);


        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invalid product ID."
                },
                {
                    status: 400
                }
            );

        }


        // =================================================
        // DATABASE CONNECTION
        // =================================================

        connection =
            await db.getConnection();


        await connection.beginTransaction();


        // =================================================
        // CHECK PRODUCT
        // =================================================

        const [
            productRows
        ] =
            await connection.execute(
                `
                    SELECT
                        id,
                        name,
                        slug
                    FROM products
                    WHERE id = ?
                    LIMIT 1
                `,
                [
                    productId
                ]
            );


        const products =
            productRows as {
                id: number;
                name: string;
                slug: string;
            }[];


        if (
            products.length === 0
        ) {

            await connection.rollback();


            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Product not found."
                },
                {
                    status: 404
                }
            );

        }


        const product =
            products[0];


        // =================================================
        // DELETE RELATED DATA
        // =================================================

        await connection.execute(
            `
                DELETE FROM product_images
                WHERE product_id = ?
            `,
            [
                productId
            ]
        );


        await connection.execute(
            `
                DELETE FROM product_shipping
                WHERE product_id = ?
            `,
            [
                productId
            ]
        );


        await connection.execute(
            `
                DELETE FROM product_specifications
                WHERE product_id = ?
            `,
            [
                productId
            ]
        );


        await connection.execute(
            `
                DELETE FROM product_seo
                WHERE product_id = ?
            `,
            [
                productId
            ]
        );


        // =================================================
        // DELETE PRODUCT
        // =================================================

        const [
            deleteResult
        ] =
            await connection.execute(
                `
                    DELETE FROM products
                    WHERE id = ?
                `,
                [
                    productId
                ]
            );


        const result =
            deleteResult as {
                affectedRows?: number;
            };


        if (
            result.affectedRows !== 1
        ) {

            throw new Error(
                "Product could not be deleted."
            );

        }


        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();


        return NextResponse.json(
            {
                success: true,

                message:
                    "Product deleted successfully.",

                productId,

                productName:
                    product.name
            },
            {
                status: 200
            }
        );


    } catch (error: any) {

        if (connection) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    "PRODUCT DELETE ROLLBACK ERROR:",
                    rollbackError
                );

            }

        }


        console.error(
            "ADMIN PRODUCT DELETE ERROR:",
            error
        );


        // =================================================
        // FOREIGN KEY ERROR
        // =================================================

        if (
            error?.code ===
                "ER_ROW_IS_REFERENCED_2" ||
            error?.code ===
                "ER_ROW_IS_REFERENCED"
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "This product cannot be deleted because it is being used by another part of the store, such as an order, cart, wishlist or review."
                },
                {
                    status: 409
                }
            );

        }


        // =================================================
        // TABLE ERROR
        // =================================================

        if (
            error?.code ===
            "ER_NO_SUCH_TABLE"
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        `Database table error: ${
                            error.sqlMessage ||
                            "A required product table does not exist."
                        }`
                },
                {
                    status: 500
                }
            );

        }


        // =================================================
        // UNKNOWN COLUMN
        // =================================================

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
                            "Unknown database column."
                        }`
                },
                {
                    status: 500
                }
            );

        }


        // =================================================
        // GENERIC ERROR
        // =================================================

        return NextResponse.json(
            {
                success: false,
                error:
                    error?.message ||
                    "Failed to delete product."
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