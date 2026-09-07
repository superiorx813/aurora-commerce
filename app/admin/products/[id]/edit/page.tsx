import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

import ProductForm from "@/components/admin/ProductForm";


export const dynamic = "force-dynamic";


export default async function EditProductPage(
    {
        params
    }: {
        params: Promise<{ id: string }>;
    }
) {

    // =====================================================
    // AUTH
    // =====================================================

    const user = await getSession();


    if (!user) {
        redirect("/account");
    }


    if (user.role !== "ADMIN") {
        redirect("/");
    }


    // =====================================================
    // PRODUCT ID
    // =====================================================

    const { id } = await params;

    const productId = Number(id);


    if (
        !Number.isInteger(productId) ||
        productId <= 0
    ) {
        redirect("/admin/products");
    }


    // =====================================================
    // LOAD PRODUCT
    // =====================================================

    const [rows] = await db.execute(
        `
        SELECT
            p.*,

            c.name AS category_name,
            c.slug AS category_slug

        FROM products p

        LEFT JOIN categories c
            ON c.id = p.category_id

        WHERE p.id = ?

        LIMIT 1
        `,
        [productId]
    );


    const products = rows as any[];


    if (products.length === 0) {
        redirect("/admin/products");
    }


    const product = products[0];


    // =====================================================
    // LOAD SHIPPING
    // =====================================================

    const [shippingRows] = await db.execute(
        `
        SELECT
            weight,
            length,
            width,
            height,
            free_shipping,
            cod_available,
            return_available,
            return_days

        FROM product_shipping

        WHERE product_id = ?

        LIMIT 1
        `,
        [productId]
    );


    // =====================================================
    // LOAD SEO
    // =====================================================

    const [seoRows] = await db.execute(
        `
        SELECT
            seo_title,
            meta_description,
            seo_keywords,
            canonical_url

        FROM product_seo

        WHERE product_id = ?

        LIMIT 1
        `,
        [productId]
    );


    // =====================================================
    // LOAD SPECIFICATIONS
    // =====================================================

    const [specificationRows] =
        await db.execute(
            `
            SELECT
                specification_group,
                specification_key,
                specification_value

            FROM product_specifications

            WHERE product_id = ?

            ORDER BY sort_order ASC, id ASC
            `,
            [productId]
        );


    // =====================================================
    // LOAD GALLERY
    // =====================================================

    const [imageRows] =
        await db.execute(
            `
            SELECT
                image_url,
                alt_text,
                sort_order,
                is_primary

            FROM product_images

            WHERE product_id = ?

            ORDER BY sort_order ASC, id ASC
            `,
            [productId]
        );


    const shipping =
        (shippingRows as any[])[0] || null;


    const seo =
        (seoRows as any[])[0] || null;


    const specifications =
        specificationRows as any[];


    const images =
        imageRows as any[];


    const editProduct = {

        ...product,

        shipping,

        seo,

        specifications,

        images

    };


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <main className="py-4 py-lg-5">

            <ProductForm
                mode="edit"
                product={editProduct}
            />

        </main>

    );

}