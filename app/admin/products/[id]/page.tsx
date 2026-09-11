
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

type Product = {
    id: number;
    category_id: number | null;
    category_name: string | null;
    category_slug: string | null;
    product_type: string | null;
    name: string;
    slug: string;
    sku: string | null;
    short_description: string | null;
    description: string | null;
    price: number | string;
    mrp: number | string;
    stock: number | string;
    rating: number | string | null;
    review_count: number | string | null;
    brand: string | null;
    image_url: string | null;
    gallery_json: string | null;
    featured: number | boolean | null;
    status: string | null;
    created_at: string | Date | null;
    updated_at: string | Date | null;
};

type ProductImage = {
    id: number;
    image_url: string;
    alt_text: string | null;
    sort_order: number | string;
    is_primary: number | boolean | null;
};

type Specification = {
    id: number;
    specification_group: string | null;
    specification_key: string | null;
    specification_value: string | null;
    sort_order: number | string;
};

type Shipping = {
    weight: number | string | null;
    length: number | string | null;
    width: number | string | null;
    height: number | string | null;
    free_shipping: number | boolean | null;
    cod_available: number | boolean | null;
    return_available: number | boolean | null;
    return_days: number | string | null;
};

type Seo = {
    seo_title: string | null;
    meta_description: string | null;
    seo_keywords: string | null;
    canonical_url: string | null;
};

function formatMoney(value: number | string | null | undefined) {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number.isFinite(amount) ? amount : 0);
}

function formatNumber(value: number | string | null | undefined) {
    const number = Number(value ?? 0);

    return Number.isFinite(number) ? number : 0;
}

function formatDate(value: string | Date | null | undefined) {
    if (!value) {
        return "—";
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function isTrue(value: number | boolean | null | undefined) {
    return value === true || value === 1 || value === ("1" as any);
}

function getStatusClass(status: string | null | undefined) {
    if (status === "ACTIVE") {
        return "bg-success text-white";
    }

    if (status === "DRAFT") {
        return "bg-warning text-dark";
    }

    return "bg-secondary text-white";
}

function getStockClass(stock: number | string) {
    const quantity = Number(stock);

    if (quantity <= 0) {
        return "bg-danger text-white";
    }

    if (quantity <= 10) {
        return "bg-primary text-white";
    }

    return "bg-success text-white";
}

function getStockLabel(stock: number | string) {
    const quantity = Number(stock);

    if (quantity <= 0) {
        return "Out of Stock";
    }

    if (quantity <= 10) {
        return "Low Stock";
    }

    return "In Stock";
}

function parseGalleryJson(value: string | null): string[] {
    if (!value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) {
            return parsed
                .map((item) =>
                    typeof item === "string"
                        ? item.trim()
                        : ""
                )
                .filter((item) => item.length > 0);
        }
    } catch {
        return [];
    }

    return [];
}

function cleanImageUrl(value: unknown) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

export default async function ProductViewPage({
    params
}: PageProps) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "ADMIN") {
        redirect("/");
    }

    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
        notFound();
    }

    let connection: any = null;

    try {
        connection = await db.getConnection();

        const [productRows] = await connection.execute(
            `
            SELECT
                p.id,
                p.category_id,
                c.name AS category_name,
                c.slug AS category_slug,
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
                p.updated_at
            FROM products p
            LEFT JOIN categories c
                ON c.id = p.category_id
            WHERE p.id = ?
            LIMIT 1
            `,
            [productId]
        );

        const products = productRows as Product[];

        if (products.length === 0) {
            notFound();
        }

        const product = products[0];

        const [imageRows] = await connection.execute(
            `
            SELECT
                id,
                image_url,
                alt_text,
                sort_order,
                is_primary
            FROM product_images
            WHERE product_id = ?
            ORDER BY
                is_primary DESC,
                sort_order ASC,
                id ASC
            `,
            [productId]
        );

        const images = imageRows as ProductImage[];

        const [specificationRows] =
            await connection.execute(
                `
                SELECT
                    id,
                    specification_group,
                    specification_key,
                    specification_value,
                    sort_order
                FROM product_specifications
                WHERE product_id = ?
                ORDER BY
                    specification_group ASC,
                    sort_order ASC,
                    id ASC
                `,
                [productId]
            );

        const specifications =
            specificationRows as Specification[];

        const [shippingRows] =
            await connection.execute(
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

        const shipping =
            (shippingRows as Shipping[])[0] ?? null;

        const [seoRows] = await connection.execute(
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

        const seo = (seoRows as Seo[])[0] ?? null;

        const primaryImage = cleanImageUrl(
            product.image_url
        );

        const databaseImages = images
            .map((image) =>
                cleanImageUrl(image.image_url)
            )
            .filter((url) => url.length > 0);

        const galleryImages = parseGalleryJson(
            product.gallery_json
        );

        const allImages = Array.from(
            new Set(
                [
                    primaryImage,
                    ...databaseImages,
                    ...galleryImages
                ].filter((url) => url.length > 0)
            )
        );

        const stockClass = getStockClass(
            product.stock
        );

        const stockLabel = getStockLabel(
            product.stock
        );

        const discount =
            Number(product.mrp) > 0
                ? Math.round(
                      ((Number(product.mrp) -
                          Number(product.price)) /
                          Number(product.mrp)) *
                          100
                  )
                : 0;

        return (
            <main
                className="min-vh-100 py-4 py-lg-5"
                style={{
                    background:
                        "linear-gradient(135deg,#eef2ff 0%,#f8fafc 45%,#ecfeff 100%)"
                }}
            >
                <div className="container-fluid px-3 px-lg-4">
                    <div
                        className="mx-auto"
                        style={{
                            maxWidth: "1500px"
                        }}
                    >
                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
                            <div>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <span
                                        className="rounded-circle bg-primary"
                                        style={{
                                            width: "10px",
                                            height: "10px"
                                        }}
                                    />
                                    <span className="text-primary fw-bold small text-uppercase">
                                        Aurora Catalog
                                    </span>
                                </div>

                                <h1 className="fw-bold text-dark mb-1">
                                    Product Details
                                </h1>

                                <p className="text-secondary mb-0">
                                    Complete product information and
                                    catalog details.
                                </p>
                            </div>

                            <div className="d-flex flex-wrap gap-2">
                                <Link
                                    href="/admin/products"
                                    className="btn btn-light border rounded-pill px-4 shadow-sm"
                                >
                                    ← Products
                                </Link>

                                <Link
                                    href={`/admin/products/${product.id}/edit`}
                                    className="btn btn-dark rounded-pill px-4 shadow-sm"
                                >
                                    Edit Product
                                </Link>
                            </div>
                        </div>

                        <div
                            className="card border border-white border-opacity-75 shadow-lg rounded-5 overflow-hidden mb-4"
                            style={{
                                backgroundColor:
                                    "rgba(255,255,255,.72)",
                                backdropFilter:
                                    "blur(18px)"
                            }}
                        >
                            <div className="card-body p-3 p-lg-5">
                                <div className="row g-4 g-xl-5">
                                    <div className="col-lg-5">
                                        <div
                                            className="rounded-5 border border-white border-opacity-75 shadow-sm overflow-hidden"
                                            style={{
                                                backgroundColor:
                                                    "rgba(248,250,252,.8)"
                                            }}
                                        >
                                            <div
                                                className="d-flex align-items-center justify-content-center"
                                                style={{
                                                    minHeight:
                                                        "460px"
                                                }}
                                            >
                                                {primaryImage ? (
                                                    <img
                                                        src={
                                                            primaryImage
                                                        }
                                                        alt={
                                                            product.name
                                                        }
                                                        className="img-fluid w-100"
                                                        style={{
                                                            height: "460px",
                                                            objectFit:
                                                                "contain"
                                                        }}
                                                    />
                                                ) : allImages.length >
                                                  0 ? (
                                                    <img
                                                        src={
                                                            allImages[0]
                                                        }
                                                        alt={
                                                            product.name
                                                        }
                                                        className="img-fluid w-100"
                                                        style={{
                                                            height: "460px",
                                                            objectFit:
                                                                "contain"
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="text-center">
                                                        <div className="display-1 fw-bold text-primary opacity-50">
                                                            A
                                                        </div>
                                                        <div className="text-secondary">
                                                            No product
                                                            image
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {allImages.length > 1 && (
                                            <div className="d-flex flex-wrap gap-2 mt-3">
                                                {allImages.map(
                                                    (
                                                        image,
                                                        index
                                                    ) => (
                                                        <div
                                                            key={`${image}-${index}`}
                                                            className={`rounded-4 border overflow-hidden ${
                                                                index ===
                                                                0
                                                                    ? "border-primary border-2"
                                                                    : "border-light"
                                                            }`}
                                                            style={{
                                                                width: "78px",
                                                                height: "78px",
                                                                backgroundColor:
                                                                    "rgba(255,255,255,.7)"
                                                            }}
                                                        >
                                                            <img
                                                                src={
                                                                    image
                                                                }
                                                                alt={`${product.name} ${
                                                                    index +
                                                                    1
                                                                }`}
                                                                className="w-100 h-100"
                                                                style={{
                                                                    objectFit:
                                                                        "cover"
                                                                }}
                                                            />
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-lg-7">
                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                            <span
                                                className={`badge rounded-pill px-3 py-2 ${getStatusClass(
                                                    product.status
                                                )}`}
                                            >
                                                {product.status ||
                                                    "DRAFT"}
                                            </span>

                                            {isTrue(
                                                product.featured
                                            ) && (
                                                <span className="badge rounded-pill px-3 py-2 bg-primary text-white">
                                                    ★ Featured
                                                </span>
                                            )}

                                            {product.product_type && (
                                                <span className="badge rounded-pill px-3 py-2 bg-white text-dark border">
                                                    {
                                                        product.product_type
                                                    }
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="display-6 fw-bold text-dark mb-3">
                                            {product.name}
                                        </h2>

                                        {product.short_description && (
                                            <p className="fs-6 text-secondary lh-lg mb-4">
                                                {
                                                    product.short_description
                                                }
                                            </p>
                                        )}

                                        <div className="d-flex flex-wrap align-items-end gap-3 mb-4">
                                            <div className="display-6 fw-bold text-dark">
                                                {formatMoney(
                                                    product.price
                                                )}
                                            </div>

                                            <div className="fs-5 text-secondary text-decoration-line-through mb-2">
                                                {formatMoney(
                                                    product.mrp
                                                )}
                                            </div>

                                            {discount > 0 && (
                                                <span className="badge bg-success rounded-pill px-3 py-2 mb-2">
                                                    {discount}% OFF
                                                </span>
                                            )}
                                        </div>

                                        <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                                            <span className="badge bg-success rounded-pill px-3 py-2">
                                                {formatNumber(
                                                    product.rating
                                                ).toFixed(1)}{" "}
                                                ★
                                            </span>

                                            <span className="text-secondary">
                                                {formatNumber(
                                                    product.review_count
                                                )}{" "}
                                                reviews
                                            </span>

                                            <span
                                                className={`badge rounded-pill px-3 py-2 ${stockClass}`}
                                            >
                                                {stockLabel} ·{" "}
                                                {formatNumber(
                                                    product.stock
                                                )}{" "}
                                                units
                                            </span>
                                        </div>

                                        <div className="row g-3 mb-4">
                                            <div className="col-sm-6">
                                                <div
                                                    className="rounded-4 border border-white border-opacity-75 p-3 h-100 shadow-sm"
                                                    style={{
                                                        backgroundColor:
                                                            "rgba(255,255,255,.58)"
                                                    }}
                                                >
                                                    <small className="text-secondary d-block mb-1">
                                                        Brand
                                                    </small>
                                                    <div className="fw-semibold text-dark">
                                                        {
                                                            product.brand ||
                                                            "—"
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-sm-6">
                                                <div
                                                    className="rounded-4 border border-white border-opacity-75 p-3 h-100 shadow-sm"
                                                    style={{
                                                        backgroundColor:
                                                            "rgba(255,255,255,.58)"
                                                    }}
                                                >
                                                    <small className="text-secondary d-block mb-1">
                                                        SKU
                                                    </small>
                                                    <div className="fw-semibold text-dark text-break">
                                                        {
                                                            product.sku ||
                                                            "—"
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-sm-6">
                                                <div
                                                    className="rounded-4 border border-white border-opacity-75 p-3 h-100 shadow-sm"
                                                    style={{
                                                        backgroundColor:
                                                            "rgba(255,255,255,.58)"
                                                    }}
                                                >
                                                    <small className="text-secondary d-block mb-1">
                                                        Category
                                                    </small>
                                                    <div className="fw-semibold text-dark">
                                                        {
                                                            product.category_name ||
                                                            "—"
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-sm-6">
                                                <div
                                                    className="rounded-4 border border-white border-opacity-75 p-3 h-100 shadow-sm"
                                                    style={{
                                                        backgroundColor:
                                                            "rgba(255,255,255,.58)"
                                                    }}
                                                >
                                                    <small className="text-secondary d-block mb-1">
                                                        Stock
                                                    </small>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span
                                                            className={`rounded-circle d-inline-flex align-items-center justify-content-center fw-bold ${stockClass}`}
                                                            style={{
                                                                width: "38px",
                                                                height: "38px"
                                                            }}
                                                        >
                                                            {formatNumber(
                                                                product.stock
                                                            )}
                                                        </span>
                                                        <span className="fw-semibold text-dark">
                                                            {stockLabel}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-top pt-4">
                                            <div className="row g-3">
                                                <div className="col-sm-6">
                                                    <small className="text-secondary d-block mb-1">
                                                        Created
                                                    </small>
                                                    <span className="text-dark">
                                                        {formatDate(
                                                            product.created_at
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="col-sm-6">
                                                    <small className="text-secondary d-block mb-1">
                                                        Last Updated
                                                    </small>
                                                    <span className="text-dark">
                                                        {formatDate(
                                                            product.updated_at
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {product.description && (
                            <section
                                className="card border border-white border-opacity-75 shadow-sm rounded-5 mb-4"
                                style={{
                                    backgroundColor:
                                        "rgba(255,255,255,.68)",
                                    backdropFilter:
                                        "blur(16px)"
                                }}
                            >
                                <div className="card-body p-4 p-lg-5">
                                    <div className="d-flex align-items-center gap-3 mb-4">
                                        <div className="rounded-3 bg-primary bg-opacity-10 text-primary p-2">
                                            ≡
                                        </div>
                                        <div>
                                            <h3 className="fw-bold mb-0">
                                                Product Description
                                            </h3>
                                            <small className="text-secondary">
                                                Detailed product
                                                information
                                            </small>
                                        </div>
                                    </div>

                                    <div
                                        className="text-secondary lh-lg"
                                        style={{
                                            whiteSpace:
                                                "pre-wrap"
                                        }}
                                    >
                                        {product.description}
                                    </div>
                                </div>
                            </section>
                        )}

                        <section
                            className="card border border-white border-opacity-75 shadow-sm rounded-5 mb-4"
                            style={{
                                backgroundColor:
                                    "rgba(255,255,255,.68)",
                                backdropFilter:
                                    "blur(16px)"
                            }}
                        >
                            <div className="card-body p-4 p-lg-5">
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="rounded-3 bg-info bg-opacity-10 text-info p-2">
                                        ⚙
                                    </div>
                                    <div>
                                        <h3 className="fw-bold mb-0">
                                            Specifications
                                        </h3>
                                        <small className="text-secondary">
                                            Product technical
                                            details
                                        </small>
                                    </div>
                                </div>

                                {specifications.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table align-middle mb-0">
                                            <thead>
                                                <tr>
                                                    <th className="text-secondary">
                                                        Group
                                                    </th>
                                                    <th className="text-secondary">
                                                        Specification
                                                    </th>
                                                    <th className="text-secondary">
                                                        Value
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {specifications.map(
                                                    (
                                                        specification
                                                    ) => (
                                                        <tr
                                                            key={
                                                                specification.id
                                                            }
                                                        >
                                                            <td>
                                                                <span className="badge rounded-pill bg-light text-dark border px-3 py-2">
                                                                    {
                                                                        specification.specification_group ||
                                                                        "General"
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="fw-semibold">
                                                                {
                                                                    specification.specification_key ||
                                                                    "—"
                                                                }
                                                            </td>
                                                            <td className="text-secondary">
                                                                {
                                                                    specification.specification_value ||
                                                                    "—"
                                                                }
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-secondary py-3">
                                        No specifications have
                                        been added.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section
                            className="card border border-white border-opacity-75 shadow-sm rounded-5 mb-4"
                            style={{
                                backgroundColor:
                                    "rgba(255,255,255,.68)",
                                backdropFilter:
                                    "blur(16px)"
                            }}
                        >
                            <div className="card-body p-4 p-lg-5">
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="rounded-3 bg-success bg-opacity-10 text-success p-2">
                                        🚚
                                    </div>
                                    <div>
                                        <h3 className="fw-bold mb-0">
                                            Shipping & Returns
                                        </h3>
                                        <small className="text-secondary">
                                            Delivery and return
                                            information
                                        </small>
                                    </div>
                                </div>

                                {shipping ? (
                                    <div className="row g-3">
                                        <div className="col-sm-6 col-lg-3">
                                            <div
                                                className="rounded-4 bg-light bg-opacity-75 p-3 h-100"
                                            >
                                                <small className="text-secondary d-block mb-1">
                                                    Weight
                                                </small>
                                                <strong>
                                                    {shipping.weight !==
                                                        null &&
                                                    shipping.weight !==
                                                        undefined
                                                        ? `${formatNumber(
                                                              shipping.weight
                                                          )} kg`
                                                        : "—"}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="col-sm-6 col-lg-3">
                                            <div
                                                className="rounded-4 bg-light bg-opacity-75 p-3 h-100"
                                            >
                                                <small className="text-secondary d-block mb-1">
                                                    Dimensions
                                                </small>
                                                <strong>
                                                    {shipping.length !==
                                                        null &&
                                                    shipping.width !==
                                                        null &&
                                                    shipping.height !==
                                                        null
                                                        ? `${shipping.length} × ${shipping.width} × ${shipping.height}`
                                                        : "—"}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="col-sm-6 col-lg-3">
                                            <div
                                                className="rounded-4 bg-light bg-opacity-75 p-3 h-100"
                                            >
                                                <small className="text-secondary d-block mb-1">
                                                    Free Shipping
                                                </small>
                                                <strong
                                                    className={
                                                        isTrue(
                                                            shipping.free_shipping
                                                        )
                                                            ? "text-success"
                                                            : "text-secondary"
                                                    }
                                                >
                                                    {isTrue(
                                                        shipping.free_shipping
                                                    )
                                                        ? "Available"
                                                        : "Not Available"}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="col-sm-6 col-lg-3">
                                            <div
                                                className="rounded-4 bg-light bg-opacity-75 p-3 h-100"
                                            >
                                                <small className="text-secondary d-block mb-1">
                                                    Cash on Delivery
                                                </small>
                                                <strong
                                                    className={
                                                        isTrue(
                                                            shipping.cod_available
                                                        )
                                                            ? "text-success"
                                                            : "text-secondary"
                                                    }
                                                >
                                                    {isTrue(
                                                        shipping.cod_available
                                                    )
                                                        ? "Available"
                                                        : "Not Available"}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div
                                                className="rounded-4 bg-light bg-opacity-75 p-3 h-100"
                                            >
                                                <small className="text-secondary d-block mb-1">
                                                    Returns
                                                </small>
                                                <strong
                                                    className={
                                                        isTrue(
                                                            shipping.return_available
                                                        )
                                                            ? "text-success"
                                                            : "text-danger"
                                                    }
                                                >
                                                    {isTrue(
                                                        shipping.return_available
                                                    )
                                                        ? "Return Available"
                                                        : "No Returns"}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div
                                                className="rounded-4 bg-light bg-opacity-75 p-3 h-100"
                                            >
                                                <small className="text-secondary d-block mb-1">
                                                    Return Period
                                                </small>
                                                <strong>
                                                    {shipping.return_days !==
                                                        null &&
                                                    shipping.return_days !==
                                                        undefined
                                                        ? `${formatNumber(
                                                              shipping.return_days
                                                          )} days`
                                                        : "—"}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-secondary">
                                        No shipping information has
                                        been added.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section
                            className="card border border-white border-opacity-75 shadow-sm rounded-5 mb-4"
                            style={{
                                backgroundColor:
                                    "rgba(255,255,255,.68)",
                                backdropFilter:
                                    "blur(16px)"
                            }}
                        >
                            <div className="card-body p-4 p-lg-5">
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="rounded-3 bg-warning bg-opacity-10 text-warning-emphasis p-2">
                                        ◈
                                    </div>
                                    <div>
                                        <h3 className="fw-bold mb-0">
                                            SEO Information
                                        </h3>
                                        <small className="text-secondary">
                                            Search engine
                                            metadata
                                        </small>
                                    </div>
                                </div>

                                {seo ? (
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <small className="text-secondary d-block mb-1">
                                                SEO Title
                                            </small>
                                            <div className="fw-semibold text-dark">
                                                {seo.seo_title ||
                                                    "—"}
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <small className="text-secondary d-block mb-1">
                                                Canonical URL
                                            </small>
                                            <div className="text-dark text-break">
                                                {seo.canonical_url ||
                                                    "—"}
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <small className="text-secondary d-block mb-1">
                                                Meta Description
                                            </small>
                                            <div className="text-secondary lh-lg">
                                                {seo.meta_description ||
                                                    "—"}
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <small className="text-secondary d-block mb-1">
                                                SEO Keywords
                                            </small>
                                            <div className="text-secondary lh-lg">
                                                {seo.seo_keywords ||
                                                    "—"}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-secondary">
                                        No SEO information has been
                                        added.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section
                            className="card border border-white border-opacity-75 shadow-sm rounded-5"
                            style={{
                                backgroundColor:
                                    "rgba(255,255,255,.68)",
                                backdropFilter:
                                    "blur(16px)"
                            }}
                        >
                            <div className="card-body p-4 p-lg-5">
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="rounded-3 bg-dark bg-opacity-10 text-dark p-2">
                                        #
                                    </div>
                                    <div>
                                        <h3 className="fw-bold mb-0">
                                            Product System Information
                                        </h3>
                                        <small className="text-secondary">
                                            Internal catalog
                                            information
                                        </small>
                                    </div>
                                </div>

                                <div className="row g-4">
                                    <div className="col-md-4">
                                        <small className="text-secondary d-block mb-1">
                                            Product ID
                                        </small>
                                        <strong>
                                            #{product.id}
                                        </strong>
                                    </div>

                                    <div className="col-md-4">
                                        <small className="text-secondary d-block mb-1">
                                            Slug
                                        </small>
                                        <div className="text-dark text-break">
                                            {product.slug ||
                                                "—"}
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <small className="text-secondary d-block mb-1">
                                            Product Type
                                        </small>
                                        <div className="text-dark">
                                            {product.product_type ||
                                                "—"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        );
    } catch (error) {
        console.error(
            "ADMIN PRODUCT VIEW ERROR:",
            error
        );

        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

