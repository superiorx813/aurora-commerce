import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";

import DeleteProductButton from "@/components/admin/DeleteProductButton";

export const dynamic = "force-dynamic";

type SearchParams = {
    q?: string;
    category?: string;
    brand?: string;
    status?: string;
    page?: string;
    perPage?: string;
};

type Product = {
    id: number;
    category_id: number | null;
    category_name: string | null;
    category_slug: string | null;
    name: string;
    slug: string;
    sku: string | null;
    description: string | null;
    price: number | string;
    mrp: number | string;
    stock: number;
    rating: number | string;
    review_count: number;
    brand: string | null;
    image_url: string | null;
    featured: number | boolean;
    status: string;
};

type Category = {
    id: number;
    name: string;
    slug: string;
};

type Brand = {
    brand: string;
};

const DEFAULT_PAGE_SIZE = 10;

const PAGE_SIZE_OPTIONS = [
    10,
    20,
    30,
    50
];

function getNumber(value: unknown, fallback = 0): number {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

function getPageNumber(value?: string): number {
    const page = Number(value);

    if (!Number.isFinite(page) || page < 1) {
        return 1;
    }

    return Math.floor(page);
}

function getPageSize(value?: string): number {
    const pageSize = Number(value);

    if (PAGE_SIZE_OPTIONS.includes(pageSize)) {
        return pageSize;
    }

    return DEFAULT_PAGE_SIZE;
}

function getStatusBadgeClass(status: string) {
    switch (status.toLowerCase()) {
        case "active":
            return "bg-success-subtle text-success";

        case "draft":
            return "bg-warning-subtle text-warning-emphasis";

        case "inactive":
            return "bg-secondary-subtle text-secondary";

        case "out_of_stock":
            return "bg-danger-subtle text-danger";

        default:
            return "bg-light text-dark";
    }
}

function getCategoryBadgeClass(category: string | null) {
    switch ((category || "").toLowerCase()) {
        case "fashion":
            return "bg-primary-subtle text-primary";

        case "electronics":
            return "bg-info-subtle text-info-emphasis";

        case "shoes":
            return "bg-warning-subtle text-warning-emphasis";

        case "beauty":
            return "bg-danger-subtle text-danger";

        case "grocery":
            return "bg-success-subtle text-success";

        case "home":
            return "bg-secondary-subtle text-secondary";

        default:
            return "bg-dark-subtle text-dark";
    }
}

function getStockBadgeClass(stock: number) {
    if (stock <= 0) {
        return "bg-danger text-white";
    }

    if (stock <= 10) {
        return "bg-primary text-white";
    }

    return "bg-success text-white";
}

export default async function AdminProductsPage({
    searchParams
}: {
    searchParams: Promise<SearchParams>;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "ADMIN") {
        redirect("/");
    }

    const params = await searchParams;

    const search = (params.q || "").trim();
    const category = (params.category || "").trim();
    const brand = (params.brand || "").trim();
    const status = (params.status || "").trim();

    const currentPage = getPageNumber(params.page);
    const pageSize = getPageSize(params.perPage);

    const searchLike = `%${search}%`;

    let connection: any = null;

    try {
        connection = await db.getConnection();

        const [categoryRows] = await connection.query(`
            SELECT
                id,
                name,
                slug
            FROM categories
            ORDER BY name ASC
        `);

        const categories = categoryRows as Category[];

        const [brandRows] = await connection.query(`
            SELECT DISTINCT
                brand
            FROM products
            WHERE brand IS NOT NULL
              AND TRIM(brand) <> ''
            ORDER BY brand ASC
        `);

        const brands = brandRows as Brand[];

        const whereConditions: string[] = [];
        const whereValues: any[] = [];

        if (search) {
            whereConditions.push(`
                (
                    p.name LIKE ?
                    OR p.slug LIKE ?
                    OR p.brand LIKE ?
                    OR p.description LIKE ?
                )
            `);

            whereValues.push(
                searchLike,
                searchLike,
                searchLike,
                searchLike
            );
        }

        if (category) {
            whereConditions.push("p.category_id = ?");
            whereValues.push(Number(category));
        }

        if (brand) {
            whereConditions.push("p.brand = ?");
            whereValues.push(brand);
        }

        if (status) {
            whereConditions.push("p.status = ?");
            whereValues.push(status);
        }

        const whereSQL =
            whereConditions.length > 0
                ? `WHERE ${whereConditions.join(" AND ")}`
                : "";

        const [countRows] = await connection.query(
            `
            SELECT COUNT(*) AS total
            FROM products p
            ${whereSQL}
            `,
            whereValues
        );

        const totalProducts = getNumber(
            (countRows as any[])[0]?.total,
            0
        );

        const totalPages = Math.max(
            1,
            Math.ceil(totalProducts / pageSize)
        );

        const safePage = Math.min(
            Math.max(currentPage, 1),
            totalPages
        );

        const offset = (safePage - 1) * pageSize;

        const [productRows] = await connection.query(
            `
            SELECT
                p.id,
                p.category_id,
                c.name AS category_name,
                c.slug AS category_slug,
                p.name,
                p.slug,
                p.sku,
                p.description,
                p.price,
                p.mrp,
                p.stock,
                p.rating,
                p.review_count,
                p.brand,
                p.image_url,
                p.featured,
                p.status
            FROM products p
            LEFT JOIN categories c
                ON c.id = p.category_id
            ${whereSQL}
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?
            `,
            [
                ...whereValues,
                pageSize,
                offset
            ]
        );

        const products = productRows as Product[];

        const [statsRows] = await connection.query(`
            SELECT
                COUNT(*) AS total_products,
                SUM(
                    CASE
                        WHEN status = 'active'
                        THEN 1
                        ELSE 0
                    END
                ) AS active_products,
                SUM(
                    CASE
                        WHEN stock <= 0
                        THEN 1
                        ELSE 0
                    END
                ) AS out_of_stock,
                SUM(
                    CASE
                        WHEN featured = 1
                        THEN 1
                        ELSE 0
                    END
                ) AS featured_products
            FROM products
        `);

        const stats = (statsRows as any[])[0] || {};

        const totalProductCount = getNumber(
            stats.total_products,
            0
        );

        const activeProductCount = getNumber(
            stats.active_products,
            0
        );

        const outOfStockCount = getNumber(
            stats.out_of_stock,
            0
        );

        const featuredProductCount = getNumber(
            stats.featured_products,
            0
        );

        connection.release();
        connection = null;

        const hasActiveFilters =
            Boolean(search) ||
            Boolean(category) ||
            Boolean(brand) ||
            Boolean(status) ||
            Boolean(
                params.perPage &&
                Number(params.perPage) !== DEFAULT_PAGE_SIZE
            );

        function createQueryString(
            overrides: Record<
                string,
                string | number | undefined
            >
        ) {
            const query = new URLSearchParams();

            if (search) {
                query.set("q", search);
            }

            if (category) {
                query.set("category", category);
            }

            if (brand) {
                query.set("brand", brand);
            }

            if (status) {
                query.set("status", status);
            }

            query.set("perPage", String(pageSize));

            Object.entries(overrides).forEach(
                ([key, value]) => {
                    if (
                        value !== undefined &&
                        value !== ""
                    ) {
                        query.set(key, String(value));
                    } else {
                        query.delete(key);
                    }
                }
            );

            return query.toString();
        }

        return (
            <div className="container-fluid bg-light min-vh-100 py-4">
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
                    <div>
                        <div className="text-primary fw-bold small text-uppercase mb-1">
                            Aurora Commerce
                        </div>
                        <h1 className="fw-bold mb-1">
                            Products
                        </h1>
                        <p className="text-muted mb-0">
                            Manage your products, inventory,
                            pricing and product information.
                        </p>
                    </div>

                    <Link
                        href="/admin/products/new"
                        className="btn btn-dark px-4 py-2 rounded-3 fw-semibold"
                    >
                        + Add Product
                    </Link>
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div className="small text-muted mb-2">
                                            Total Products
                                        </div>
                                        <div className="fs-3 fw-bold">
                                            {totalProductCount}
                                        </div>
                                    </div>
                                    <div className="rounded-3 bg-primary-subtle text-primary p-3 fw-bold">
                                        P
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div className="small text-muted mb-2">
                                            Active Products
                                        </div>
                                        <div className="fs-3 fw-bold text-success">
                                            {activeProductCount}
                                        </div>
                                    </div>
                                    <div className="rounded-3 bg-success-subtle text-success p-3 fw-bold">
                                        ✓
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div className="small text-muted mb-2">
                                            Out of Stock
                                        </div>
                                        <div className="fs-3 fw-bold text-danger">
                                            {outOfStockCount}
                                        </div>
                                    </div>
                                    <div className="rounded-3 bg-danger-subtle text-danger p-3 fw-bold">
                                        !
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div className="small text-muted mb-2">
                                            Featured
                                        </div>
                                        <div className="fs-3 fw-bold text-warning-emphasis">
                                            {featuredProductCount}
                                        </div>
                                    </div>
                                    <div className="rounded-3 bg-warning-subtle text-warning-emphasis p-3 fw-bold">
                                        ★
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body p-3">
                        <form
                            method="GET"
                            className="row g-2 align-items-center"
                        >
                            <div className="col-12 col-xl-4">
                                <input
                                    type="search"
                                    name="q"
                                    defaultValue={search}
                                    className="form-control"
                                    placeholder="Search products, SKU or brand..."
                                />
                            </div>

                            <div className="col-12 col-md-6 col-xl-2">
                                <select
                                    name="category"
                                    defaultValue={category}
                                    className="form-select"
                                >
                                    <option value="">
                                        All Categories
                                    </option>

                                    {categories.map(
                                        (item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.name}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="col-12 col-md-6 col-xl-2">
                                <select
                                    name="brand"
                                    defaultValue={brand}
                                    className="form-select"
                                >
                                    <option value="">
                                        All Brands
                                    </option>

                                    {brands.map(
                                        (item) => (
                                            <option
                                                key={item.brand}
                                                value={item.brand}
                                            >
                                                {item.brand}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="col-12 col-md-6 col-xl-1">
                                <select
                                    name="status"
                                    defaultValue={status}
                                    className="form-select"
                                >
                                    <option value="">
                                        Status
                                    </option>
                                    <option value="active">
                                        Active
                                    </option>
                                    <option value="draft">
                                        Draft
                                    </option>
                                    <option value="inactive">
                                        Inactive
                                    </option>
                                    <option value="out_of_stock">
                                        Out of Stock
                                    </option>
                                </select>
                            </div>

                            <div className="col-12 col-md-6 col-xl-1">
                                <select
                                    name="perPage"
                                    defaultValue={pageSize}
                                    className="form-select"
                                    aria-label="Products per page"
                                >
                                    {PAGE_SIZE_OPTIONS.map(
                                        (size) => (
                                            <option
                                                key={size}
                                                value={size}
                                            >
                                                {size} per page
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="col-12 col-md-6 col-xl-1">
                                <button
                                    type="submit"
                                    className="btn btn-dark w-100"
                                >
                                    Search
                                </button>
                            </div>

                            {hasActiveFilters && (
                                <div className="col-12 col-md-6 col-xl-1">
                                    <Link
                                        href="/admin/products"
                                        className="btn btn-light border w-100"
                                    >
                                        Clear
                                    </Link>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-body p-0">
                        <div className="p-4 border-bottom">
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                                <div>
                                    <h5 className="fw-bold mb-1">
                                        Product Catalogue
                                    </h5>
                                    <div className="small text-muted">
                                        Showing {products.length} of{" "}
                                        {totalProducts} products
                                    </div>
                                </div>

                                <div className="small text-muted">
                                    Page {safePage} of {totalPages}
                                </div>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="px-4 py-3">
                                            Product
                                        </th>
                                        <th className="py-3">
                                            Category
                                        </th>
                                        <th className="py-3">
                                            Price
                                        </th>
                                        <th className="py-3">
                                            Stock
                                        </th>
                                        <th className="py-3">
                                            Rating
                                        </th>
                                        <th className="py-3">
                                            Status
                                        </th>
                                        <th className="text-end px-4 py-3">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {products.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="text-center py-5"
                                            >
                                                <div className="fw-bold fs-5 mb-1">
                                                    No products found
                                                </div>

                                                <div className="text-muted mb-3">
                                                    Try changing your filters
                                                    or create a new product.
                                                </div>

                                                <Link
                                                    href="/admin/products/new"
                                                    className="btn btn-dark rounded-3"
                                                >
                                                    Create Product
                                                </Link>
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map(
                                            (product) => {
                                                const imageUrl =
                                                    typeof product.image_url ===
                                                    "string"
                                                        ? product.image_url.trim()
                                                        : "";

                                                const price =
                                                    getNumber(
                                                        product.price
                                                    );

                                                const mrp =
                                                    getNumber(
                                                        product.mrp
                                                    );

                                                const rating =
                                                    getNumber(
                                                        product.rating
                                                    );

                                                const categoryClass =
                                                    getCategoryBadgeClass(
                                                        product.category_name
                                                    );

                                                const stockClass =
                                                    getStockBadgeClass(
                                                        product.stock
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            product.id
                                                        }
                                                    >
                                                        <td className="px-4">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div
                                                                    className="rounded-3 border bg-light d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
                                                                    style={{
                                                                        width: "56px",
                                                                        height: "56px"
                                                                    }}
                                                                >
                                                                    {imageUrl ? (
                                                                        <img
                                                                            src={
                                                                                imageUrl
                                                                            }
                                                                            alt={
                                                                                product.name
                                                                            }
                                                                            className="w-100 h-100 object-fit-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="fw-bold text-primary fs-5">
                                                                            A
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <div
                                                                        className="fw-semibold text-truncate"
                                                                        style={{
                                                                            maxWidth:
                                                                                "280px"
                                                                        }}
                                                                    >
                                                                        {
                                                                            product.name
                                                                        }
                                                                    </div>

                                                                    {product.brand && (
                                                                        <div className="small text-muted">
                                                                            {
                                                                                product.brand
                                                                            }
                                                                        </div>
                                                                    )}

                                                                    <div className="small text-muted">
                                                                        SKU:{" "}
                                                                        {
                                                                            product.sku ||
                                                                            "—"
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`badge rounded-pill px-3 py-2 fw-semibold ${categoryClass}`}
                                                            >
                                                                {
                                                                    product.category_name ||
                                                                    "Uncategorized"
                                                                }
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <div className="fw-bold">
                                                                {money(
                                                                    price
                                                                )}
                                                            </div>

                                                            {mrp > price && (
                                                                <div className="small text-muted text-decoration-line-through">
                                                                    {money(
                                                                        mrp
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`rounded-circle d-inline-flex align-items-center justify-content-center fw-bold ${stockClass}`}
                                                                style={{
                                                                    width: "38px",
                                                                    height: "38px"
                                                                }}
                                                                title={
                                                                    product.stock <=
                                                                    0
                                                                        ? "Out of Stock"
                                                                        : product.stock <=
                                                                            10
                                                                          ? "Low Stock"
                                                                          : "In Stock"
                                                                }
                                                            >
                                                                {
                                                                    product.stock
                                                                }
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <div className="d-flex align-items-center gap-1">
                                                                <span className="text-warning">
                                                                    ★
                                                                </span>

                                                                <span className="fw-semibold">
                                                                    {rating.toFixed(
                                                                        1
                                                                    )}
                                                                </span>
                                                            </div>

                                                            <div className="small text-muted">
                                                                {
                                                                    product.review_count
                                                                }{" "}
                                                                reviews
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`badge rounded-pill px-3 py-2 text-uppercase ${getStatusBadgeClass(
                                                                    product.status
                                                                )}`}
                                                            >
                                                                {
                                                                    product.status
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="text-end px-4">
                                                            <div className="d-flex justify-content-end gap-2">
                                                                <Link
                                                                    href={`/admin/products/${product.id}`}
                                                                    className="btn btn-sm btn-light border"
                                                                    title="View product"
                                                                >
                                                                    View
                                                                </Link>

                                                                <Link
                                                                    href={`/admin/products/${product.id}/edit`}
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    title="Edit product"
                                                                >
                                                                    Edit
                                                                </Link>

                                                                <DeleteProductButton
                                                                    productId={
                                                                        product.id
                                                                    }
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="border-top p-3">
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                                    <div className="small text-muted">
                                        Showing {products.length} of{" "}
                                        {totalProducts} products
                                    </div>

                                    <nav>
                                        <ul className="pagination mb-0 align-items-center">
                                            <li
                                                className={
                                                    safePage <= 1
                                                        ? "disabled"
                                                        : ""
                                                }
                                            >
                                                <Link
                                                    className="page-link"
                                                    href={
                                                        safePage > 1
                                                            ? `?${createQueryString(
                                                                  {
                                                                      page:
                                                                          safePage -
                                                                          1
                                                                  }
                                                              )}`
                                                            : "#"
                                                    }
                                                >
                                                    Previous
                                                </Link>
                                            </li>

                                            {Array.from(
                                                {
                                                    length:
                                                        totalPages
                                                },
                                                (_, index) =>
                                                    index + 1
                                            )
                                                .filter(
                                                    (page) =>
                                                        page ===
                                                            1 ||
                                                        page ===
                                                            totalPages ||
                                                        Math.abs(
                                                            page -
                                                                safePage
                                                        ) <= 2
                                                )
                                                .map(
                                                    (
                                                        page,
                                                        index,
                                                        pages
                                                    ) => {
                                                        const previous =
                                                            pages[
                                                                index -
                                                                    1
                                                            ];

                                                        const showEllipsis =
                                                            previous &&
                                                            page -
                                                                previous >
                                                                1;

                                                        return (
                                                            <span
                                                                key={
                                                                    page
                                                                }
                                                                className="d-flex align-items-center"
                                                            >
                                                                {showEllipsis && (
                                                                    <span className="px-1 text-muted">
                                                                        ...
                                                                    </span>
                                                                )}

                                                                <li
                                                                    className={
                                                                        page ===
                                                                        safePage
                                                                            ? "active"
                                                                            : ""
                                                                    }
                                                                >
                                                                    <Link
                                                                        className="page-link"
                                                                        href={`?${createQueryString(
                                                                            {
                                                                                page
                                                                            }
                                                                        )}`}
                                                                    >
                                                                        {
                                                                            page
                                                                        }
                                                                    </Link>
                                                                </li>
                                                            </span>
                                                        );
                                                    }
                                                )}

                                            <li
                                                className={
                                                    safePage >=
                                                    totalPages
                                                        ? "disabled"
                                                        : ""
                                                }
                                            >
                                                <Link
                                                    className="page-link"
                                                    href={
                                                        safePage <
                                                        totalPages
                                                            ? `?${createQueryString(
                                                                  {
                                                                      page:
                                                                          safePage +
                                                                          1
                                                                  }
                                                              )}`
                                                            : "#"
                                                    }
                                                >
                                                    Next
                                                </Link>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        if (connection) {
            connection.release();
        }

        console.error(
            "ADMIN PRODUCTS PAGE ERROR:",
            error
        );

        return (
            <div className="container-fluid py-5">
                <div className="alert alert-danger rounded-4 shadow-sm">
                    <h5 className="fw-bold">
                        Unable to load products
                    </h5>

                    <p className="mb-3">
                        Something went wrong while loading
                        the product catalogue.
                    </p>

                    <Link
                        href="/admin/products"
                        className="btn btn-danger rounded-3"
                    >
                        Try Again
                    </Link>
                </div>
            </div>
        );
    }
}