import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";

import DeleteProductButton
    from "@/components/admin/DeleteProductButton";

export const dynamic = "force-dynamic";


/* =========================================================
   PRODUCT TYPE
   ========================================================= */

type Product = {
    id: number;

    category_id: number | null;

    product_type: string | null;

    name: string;

    slug: string;

    sku: string | null;

    short_description: string | null;

    description: string | null;

    price: number;

    mrp: number;

    stock: number;

    rating: number;

    review_count: number;

    brand: string | null;

    image_url: string | null;

    featured: number;

    status: "DRAFT" | "ACTIVE" | "ARCHIVED";

    category_name: string | null;

    category_slug: string | null;
};


/* =========================================================
   CATEGORY TYPE
   ========================================================= */

type Category = {
    id: number;
    name: string;
    slug: string;
};


/* =========================================================
   GET CATEGORIES
   ========================================================= */

async function getCategories(): Promise<Category[]> {

    const [rows] = await db.query(`
        SELECT
            id,
            name,
            slug
        FROM categories
        ORDER BY name ASC
    `);

    return rows as Category[];
}


/* =========================================================
   GET BRANDS
   ========================================================= */

async function getBrands(): Promise<string[]> {

    const [rows] = await db.query(`
        SELECT DISTINCT brand
        FROM products
        WHERE brand IS NOT NULL
          AND TRIM(brand) <> ''
        ORDER BY brand ASC
    `);

    return (rows as { brand: string }[])
        .map(row => row.brand);
}


/* =========================================================
   GET PRODUCTS
   WITH SERVER-SIDE PAGINATION
   ========================================================= */

async function getProducts({
    search,
    category,
    brand,
    page,
    limit
}: {
    search: string;
    category: string;
    brand: string;
    page: number;
    limit: number;
}): Promise<{
    products: Product[];
    total: number;
}> {

    /* -------------------------------------------------------
       BASE WHERE QUERY
       ------------------------------------------------------- */

    let whereSql = `
        FROM products p

        LEFT JOIN categories c
            ON c.id = p.category_id

        WHERE 1 = 1
    `;


    const params: (string | number)[] = [];


    /* -------------------------------------------------------
       SEARCH
       ------------------------------------------------------- */

    if (search) {

        whereSql += `
            AND (
                p.name LIKE ?
                OR p.sku LIKE ?
                OR p.brand LIKE ?
            )
        `;

        const searchValue = `%${search}%`;

        params.push(
            searchValue,
            searchValue,
            searchValue
        );
    }


    /* -------------------------------------------------------
       CATEGORY
       ------------------------------------------------------- */

    if (category) {

        const categoryId =
            Number(category);


        if (
            Number.isInteger(categoryId) &&
            categoryId > 0
        ) {

            whereSql += `
                AND p.category_id = ?
            `;

            params.push(categoryId);
        }
    }


    /* -------------------------------------------------------
       BRAND
       ------------------------------------------------------- */

    if (brand) {

        whereSql += `
            AND p.brand = ?
        `;

        params.push(brand);
    }


    /* -------------------------------------------------------
       GET TOTAL MATCHING PRODUCTS
       ------------------------------------------------------- */

    const [countRows] = await db.query(
        `
            SELECT COUNT(*) AS total
            ${whereSql}
        `,
        params
    );


    const total =
        Number(
            (countRows as { total: number }[])[0]?.total || 0
        );


    /* -------------------------------------------------------
       CALCULATE OFFSET
       ------------------------------------------------------- */

    const offset =
        (page - 1) * limit;


    /* -------------------------------------------------------
       GET PRODUCTS
       ------------------------------------------------------- */

    const [rows] = await db.query(
        `
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
                p.featured,
                p.status,

                c.name AS category_name,
                c.slug AS category_slug

            ${whereSql}

            ORDER BY p.created_at DESC

            LIMIT ? OFFSET ?
        `,
        [
            ...params,
            limit,
            offset
        ]
    );


    return {
        products: rows as Product[],
        total
    };
}


/* =========================================================
   BUILD PAGINATION URL
   ========================================================= */

function buildPageUrl({
    search,
    category,
    brand,
    page,
    limit
}: {
    search: string;
    category: string;
    brand: string;
    page: number;
    limit: number;
}) {

    const query =
        new URLSearchParams();


    if (search) {

        query.set(
            "search",
            search
        );
    }


    if (category) {

        query.set(
            "category",
            category
        );
    }


    if (brand) {

        query.set(
            "brand",
            brand
        );
    }


    query.set(
        "page",
        String(page)
    );


    query.set(
        "limit",
        String(limit)
    );


    return `/admin/products?${query.toString()}`;
}


/* =========================================================
   CREATE PAGE NUMBER LIST
   ========================================================= */

function getPaginationPages(
    currentPage: number,
    totalPages: number
): (number | "ellipsis")[] {

    /* -------------------------------------------------------
       SMALL NUMBER OF PAGES
       ------------------------------------------------------- */

    if (totalPages <= 7) {

        return Array.from(
            { length: totalPages },
            (_, index) => index + 1
        );
    }


    /* -------------------------------------------------------
       BEGINNING
       ------------------------------------------------------- */

    if (currentPage <= 4) {

        return [
            1,
            2,
            3,
            4,
            5,
            "ellipsis",
            totalPages
        ];
    }


    /* -------------------------------------------------------
       END
       ------------------------------------------------------- */

    if (currentPage >= totalPages - 3) {

        return [
            1,
            "ellipsis",
            totalPages - 4,
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages
        ];
    }


    /* -------------------------------------------------------
       MIDDLE
       ------------------------------------------------------- */

    return [
        1,
        "ellipsis",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "ellipsis",
        totalPages
    ];
}


/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({
    status
}: {
    status: Product["status"];
}) {

    if (status === "ACTIVE") {

        return (
            <span className="badge rounded-pill text-bg-success">
                Active
            </span>
        );
    }


    if (status === "ARCHIVED") {

        return (
            <span className="badge rounded-pill text-bg-secondary">
                Archived
            </span>
        );
    }


    return (
        <span className="badge rounded-pill text-bg-warning">
            Draft
        </span>
    );
}


/* =========================================================
   ADMIN PRODUCTS PAGE
   ========================================================= */

export default async function AdminProductsPage(
    {
        searchParams
    }: {
        searchParams: Promise<{
            search?: string;
            category?: string;
            brand?: string;
            page?: string;
            limit?: string;
        }>;
    }
) {

    /* -------------------------------------------------------
       CHECK LOGIN
       ------------------------------------------------------- */

    const user = await getSession();


    if (!user) {

        redirect("/account");
    }


    /* -------------------------------------------------------
       CHECK ADMIN
       ------------------------------------------------------- */

    if (user.role !== "ADMIN") {

        redirect("/");
    }


    /* -------------------------------------------------------
       READ URL PARAMETERS
       ------------------------------------------------------- */

    const params =
        await searchParams;


    /* -------------------------------------------------------
       SEARCH
       ------------------------------------------------------- */

    const search =
        typeof params.search === "string"
            ? params.search.trim()
            : "";


    /* -------------------------------------------------------
       CATEGORY
       ------------------------------------------------------- */

    const category =
        typeof params.category === "string"
            ? params.category
            : "";


    /* -------------------------------------------------------
       BRAND
       ------------------------------------------------------- */

    const brand =
        typeof params.brand === "string"
            ? params.brand
            : "";


    /* -------------------------------------------------------
       PAGE
       ------------------------------------------------------- */

    const requestedPage =
        Number(params.page || 1);


    const page =
        Number.isInteger(requestedPage) &&
        requestedPage > 0
            ? requestedPage
            : 1;


    /* -------------------------------------------------------
       PAGE SIZE
       ------------------------------------------------------- */

    const requestedLimit =
        Number(params.limit || 10);


    const limit =
        [10, 20, 50].includes(requestedLimit)
            ? requestedLimit
            : 10;


    /* -------------------------------------------------------
       LOAD CATEGORIES + BRANDS
       ------------------------------------------------------- */

    const [
        categories,
        brands
    ] = await Promise.all([
        getCategories(),
        getBrands()
    ]);


    /* -------------------------------------------------------
       FIRST PRODUCT QUERY
       ------------------------------------------------------- */

    const firstProductResult =
        await getProducts({
            search,
            category,
            brand,
            page,
            limit
        });


    /* -------------------------------------------------------
       TOTAL PRODUCTS
       ------------------------------------------------------- */

    const totalProducts =
        firstProductResult.total;


    /* -------------------------------------------------------
       TOTAL PAGES
       ------------------------------------------------------- */

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                totalProducts / limit
            )
        );


    /* -------------------------------------------------------
       SAFE CURRENT PAGE
       ------------------------------------------------------- */

    const currentPage =
        Math.min(
            page,
            totalPages
        );


    /* -------------------------------------------------------
       GET PRODUCTS
       ------------------------------------------------------- */

    const productResult =
        currentPage === page
            ? firstProductResult
            : await getProducts({
                search,
                category,
                brand,
                page: currentPage,
                limit
            });


    const products =
        productResult.products;


    /* -------------------------------------------------------
       RESULT RANGE
       ------------------------------------------------------- */

    const startItem =
        totalProducts === 0
            ? 0
            : (currentPage - 1) * limit + 1;


    const endItem =
        Math.min(
            currentPage * limit,
            totalProducts
        );


    /* -------------------------------------------------------
       PAGINATION PAGE NUMBERS
       ------------------------------------------------------- */

    const paginationPages =
        getPaginationPages(
            currentPage,
            totalPages
        );


    /* -------------------------------------------------------
       STATISTICS
       ------------------------------------------------------- */

    const activeProducts =
        products.filter(
            product =>
                product.status === "ACTIVE"
        ).length;


    const draftProducts =
        products.filter(
            product =>
                product.status === "DRAFT"
        ).length;


    const lowStockProducts =
        products.filter(
            product =>
                Number(product.stock) < 10
        ).length;


    /* -------------------------------------------------------
       FILTER STATE
       ------------------------------------------------------- */

    const hasFilters =
        Boolean(
            search ||
            category ||
            brand
        );


    /* =======================================================
       PAGE
       ======================================================= */

    return (

        <main className="aurora-admin-products py-4 py-lg-5">

            <div className="container-fluid px-3 px-lg-4">


                {/* =================================================
                   HEADER
                   ================================================= */}

                <div
                    className="
                        d-flex
                        flex-column
                        flex-lg-row
                        justify-content-between
                        align-items-lg-end
                        gap-4
                        mb-4
                    "
                >

                    <div>

                        <div className="text-uppercase small fw-bold text-primary mb-2">
                            Aurora Catalog
                        </div>


                        <h1 className="display-6 fw-bold mb-2">
                            Product Management
                        </h1>


                        <p className="text-secondary mb-0">
                            Manage your Aurora storefront products,
                            inventory and catalog.
                        </p>

                    </div>


                    <div className="d-flex flex-wrap gap-2">

                        <Link
                            href="/admin"
                            className="btn btn-light border rounded-3 px-4"
                        >
                            ← Dashboard
                        </Link>


                        <Link
                            href="/admin/products/new"
                            className="btn btn-primary rounded-3 px-4 fw-semibold"
                        >
                            + Create Product
                        </Link>

                    </div>

                </div>


                {/* =================================================
                   STATISTICS
                   ================================================= */}

                <div className="row g-3 mb-4">


                    {/* TOTAL */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <div className="card border-0 shadow-sm rounded-4 h-100">

                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-start">

                                    <div>

                                        <div className="text-secondary small mb-2">
                                            Total Products
                                        </div>

                                        <div className="fs-2 fw-bold">
                                            {totalProducts}
                                        </div>

                                    </div>


                                    <div className="bg-primary bg-opacity-10 text-primary rounded-3 p-3">
                                        P
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* ACTIVE */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <div className="card border-0 shadow-sm rounded-4 h-100">

                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-start">

                                    <div>

                                        <div className="text-secondary small mb-2">
                                            Active Products
                                        </div>

                                        <div className="fs-2 fw-bold text-success">
                                            {activeProducts}
                                        </div>

                                    </div>


                                    <div className="bg-success bg-opacity-10 text-success rounded-3 p-3">
                                        ✓
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* DRAFT */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <div className="card border-0 shadow-sm rounded-4 h-100">

                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-start">

                                    <div>

                                        <div className="text-secondary small mb-2">
                                            Draft Products
                                        </div>

                                        <div className="fs-2 fw-bold text-warning">
                                            {draftProducts}
                                        </div>

                                    </div>


                                    <div className="bg-warning bg-opacity-10 text-warning rounded-3 p-3">
                                        D
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* LOW STOCK */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <div className="card border-0 shadow-sm rounded-4 h-100">

                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-start">

                                    <div>

                                        <div className="text-secondary small mb-2">
                                            Low Stock
                                        </div>

                                        <div className="fs-2 fw-bold text-danger">
                                            {lowStockProducts}
                                        </div>

                                    </div>


                                    <div className="bg-danger bg-opacity-10 text-danger rounded-3 p-3">
                                        !
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                   PRODUCTS CARD
                   ================================================= */}

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">


                    {/* =================================================
                       FILTER AREA
                       ================================================= */}

                    <div className="card-header bg-white border-0 p-4">

                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-3">

                            <div>

                                <h5 className="fw-bold mb-1">
                                    All Products
                                </h5>

                                <p className="text-secondary small mb-0">
                                    Your complete Aurora product catalog.
                                </p>

                            </div>


                            {/* RESULT SUMMARY */}

                            <div className="small text-secondary">

                                {totalProducts > 0 ? (

                                    <>
                                        Showing{" "}
                                        <strong>
                                            {startItem}
                                        </strong>
                                        {" "}–{" "}
                                        <strong>
                                            {endItem}
                                        </strong>
                                        {" "}of{" "}
                                        <strong>
                                            {totalProducts}
                                        </strong>
                                    </>

                                ) : (

                                    "No products found"

                                )}

                            </div>

                        </div>


                        {/* =================================================
                           FILTER FORM
                           ================================================= */}

                        <form
                            method="GET"
                            action="/admin/products"
                            className="row g-2"
                        >

                            {/* RESET PAGE WHEN FILTERING */}

                            <input
                                type="hidden"
                                name="page"
                                value="1"
                            />


                            {/* SEARCH */}

                            <div className="col-12 col-lg">

                                <div className="input-group">

                                    <span className="input-group-text bg-light border-end-0">
                                        🔍
                                    </span>


                                    <input
                                        type="search"
                                        name="search"
                                        defaultValue={search}
                                        className="form-control bg-light border-start-0"
                                        placeholder="Search products, SKU or brand..."
                                    />

                                </div>

                            </div>


                            {/* CATEGORY */}

                            <div className="col-12 col-sm-6 col-lg-2">

                                <select
                                    name="category"
                                    defaultValue={category}
                                    className="form-select bg-light"
                                >

                                    <option value="">
                                        All categories
                                    </option>


                                    {categories.map(
                                        item => (

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


                            {/* BRAND */}

                            <div className="col-12 col-sm-6 col-lg-2">

                                <select
                                    name="brand"
                                    defaultValue={brand}
                                    className="form-select bg-light"
                                >

                                    <option value="">
                                        All brands
                                    </option>


                                    {brands.map(
                                        item => (

                                            <option
                                                key={item}
                                                value={item}
                                            >
                                                {item}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* PAGE SIZE */}

                            <div className="col-12 col-sm-6 col-lg-2">

                                <select
                                    name="limit"
                                    defaultValue={String(limit)}
                                    className="form-select bg-light"
                                    aria-label="Products per page"
                                >

                                    <option value="10">
                                        10 per page
                                    </option>

                                    <option value="20">
                                        20 per page
                                    </option>

                                    <option value="50">
                                        50 per page
                                    </option>

                                </select>

                            </div>


                            {/* SEARCH BUTTON */}

                            <div className="col-12 col-sm-auto">

                                <button
                                    type="submit"
                                    className="btn btn-dark px-4 w-100"
                                >
                                    Search
                                </button>

                            </div>


                            {/* CLEAR */}

                            {hasFilters && (

                                <div className="col-12 col-sm-auto">

                                    <Link
                                        href="/admin/products"
                                        className="btn btn-light border px-4 w-100"
                                    >
                                        Clear
                                    </Link>

                                </div>

                            )}

                        </form>

                    </div>


                    {/* =================================================
                       TABLE
                       ================================================= */}

                    <div className="table-responsive">

                        <table className="table table-hover align-middle mb-0">


                            <thead className="table-light">

                                <tr>

                                    <th className="px-4 py-3">
                                        Product
                                    </th>

                                    <th>
                                        Category
                                    </th>

                                    <th>
                                        Price
                                    </th>

                                    <th>
                                        Stock
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th className="text-end px-4">
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>


                                {/* =================================================
                                   EMPTY / NO RESULTS
                                   ================================================= */}

                                {products.length === 0 && (

                                    <tr>

                                        <td
                                            colSpan={6}
                                            className="text-center py-5"
                                        >

                                            <div className="py-5">

                                                <div
                                                    className="
                                                        mx-auto
                                                        mb-3
                                                        rounded-circle
                                                        bg-primary
                                                        bg-opacity-10
                                                        text-primary
                                                        d-flex
                                                        align-items-center
                                                        justify-content-center
                                                    "
                                                    style={{
                                                        width: "70px",
                                                        height: "70px"
                                                    }}
                                                >
                                                    P
                                                </div>


                                                <h5 className="fw-bold">

                                                    {hasFilters
                                                        ? "No matching products"
                                                        : "No products yet"
                                                    }

                                                </h5>


                                                <p className="text-secondary">

                                                    {hasFilters
                                                        ? "Try changing your search or filters."
                                                        : "Create your first Aurora product."
                                                    }

                                                </p>


                                                {hasFilters ? (

                                                    <Link
                                                        href="/admin/products"
                                                        className="btn btn-light border rounded-3 px-4"
                                                    >
                                                        Clear Filters
                                                    </Link>

                                                ) : (

                                                    <Link
                                                        href="/admin/products/new"
                                                        className="btn btn-primary rounded-3 px-4"
                                                    >
                                                        Create Product
                                                    </Link>

                                                )}

                                            </div>

                                        </td>

                                    </tr>

                                )}


                                {/* =================================================
                                   PRODUCTS
                                   ================================================= */}

                                {products.map(product => (

                                    <tr key={product.id}>


                                        {/* PRODUCT */}

                                        <td className="px-4">

                                            <div className="d-flex align-items-center gap-3">


                                                <div
                                                    className="
                                                        rounded-3
                                                        overflow-hidden
                                                        bg-light
                                                        d-flex
                                                        align-items-center
                                                        justify-content-center
                                                        flex-shrink-0
                                                    "
                                                    style={{
                                                        width: "60px",
                                                        height: "60px"
                                                    }}
                                                >

                                                    {product.image_url ? (

                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="w-100 h-100 object-fit-cover"
                                                        />

                                                    ) : (

                                                        <span className="fw-bold text-primary fs-5">
                                                            A
                                                        </span>

                                                    )}

                                                </div>


                                                <div>

                                                    <div className="fw-semibold">
                                                        {product.name}
                                                    </div>


                                                    <div className="small text-secondary">
                                                        {product.brand || "Aurora"}
                                                    </div>


                                                    {product.sku && (

                                                        <div className="small text-muted">
                                                            SKU: {product.sku}
                                                        </div>

                                                    )}

                                                </div>

                                            </div>

                                        </td>


                                        {/* CATEGORY */}

                                        <td>

                                            <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">

                                                {product.category_name ||
                                                    "Uncategorized"}

                                            </span>

                                        </td>


                                        {/* PRICE */}

                                        <td>

                                            <div className="fw-bold">
                                                {money(Number(product.price))}
                                            </div>

                                            <del className="small text-secondary">
                                                {money(Number(product.mrp))}
                                            </del>

                                        </td>


                                        {/* STOCK */}

                                        <td>

                                            {Number(product.stock) < 10 ? (

                                                <span className="badge text-bg-danger rounded-pill">
                                                    {product.stock}
                                                </span>

                                            ) : (

                                                <span className="badge text-bg-success rounded-pill">
                                                    {product.stock}
                                                </span>

                                            )}

                                        </td>


                                        {/* STATUS */}

                                        <td>

                                            <StatusBadge
                                                status={product.status}
                                            />

                                        </td>


                                        {/* ACTIONS */}

                                        <td className="text-end px-4">

                                            <div className="d-inline-flex gap-2">


                                                <Link
                                                    href={`/products/${product.slug}`}
                                                    className="btn btn-sm btn-light border rounded-3"
                                                >
                                                    View
                                                </Link>


                                                <Link
                                                    href={`/admin/products/${product.id}/edit`}
                                                    className="btn btn-sm btn-outline-primary rounded-3"
                                                >
                                                    Edit
                                                </Link>


                                                <DeleteProductButton
                                                    productId={product.id}
                                                    productName={product.name}
                                                />

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>


                    {/* =================================================
                       PAGINATION FOOTER
                       ================================================= */}

                    <div className="border-top bg-light px-4 py-3">

                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">


                            {/* =================================================
                               RESULT INFORMATION
                               ================================================= */}

                            <div>

                                <small className="text-secondary">

                                    Showing{" "}

                                    <strong>
                                        {startItem}
                                    </strong>

                                    {" "}–{" "}

                                    <strong>
                                        {endItem}
                                    </strong>

                                    {" "}of{" "}

                                    <strong>
                                        {totalProducts}
                                    </strong>

                                    {" "}product
                                    {totalProducts !== 1 ? "s" : ""}

                                </small>


                                {hasFilters && (

                                    <div className="small text-primary mt-1">
                                        Filters are active
                                    </div>

                                )}

                            </div>


                            {/* =================================================
                               PAGINATION
                               ================================================= */}

                            {totalProducts > 0 && totalPages > 1 && (

                                <nav
                                    aria-label="Product pagination"
                                >

                                    <ul className="pagination pagination-sm mb-0">


                                        {/* PREVIOUS */}

                                        <li
                                            className={`page-item ${
                                                currentPage <= 1
                                                    ? "disabled"
                                                    : ""
                                            }`}
                                        >

                                            {currentPage <= 1 ? (

                                                <span className="page-link">
                                                    ←
                                                </span>

                                            ) : (

                                                <Link
                                                    className="page-link"
                                                    href={buildPageUrl({
                                                        search,
                                                        category,
                                                        brand,
                                                        page: currentPage - 1,
                                                        limit
                                                    })}
                                                    aria-label="Previous page"
                                                >
                                                    ←
                                                </Link>

                                            )}

                                        </li>


                                        {/* PAGE NUMBERS */}

                                        {paginationPages.map(
                                            (pageNumber, index) => {

                                                if (
                                                    pageNumber ===
                                                    "ellipsis"
                                                ) {

                                                    return (
                                                        <li
                                                            key={`ellipsis-${index}`}
                                                            className="page-item disabled"
                                                        >
                                                            <span className="page-link">
                                                                …
                                                            </span>
                                                        </li>
                                                    );
                                                }


                                                return (
                                                    <li
                                                        key={pageNumber}
                                                        className={`page-item ${
                                                            pageNumber === currentPage
                                                                ? "active"
                                                                : ""
                                                        }`}
                                                    >

                                                        <Link
                                                            className="page-link"
                                                            href={buildPageUrl({
                                                                search,
                                                                category,
                                                                brand,
                                                                page: pageNumber,
                                                                limit
                                                            })}
                                                        >
                                                            {pageNumber}
                                                        </Link>

                                                    </li>
                                                );
                                            }
                                        )}


                                        {/* NEXT */}

                                        <li
                                            className={`page-item ${
                                                currentPage >= totalPages
                                                    ? "disabled"
                                                    : ""
                                            }`}
                                        >

                                            {currentPage >= totalPages ? (

                                                <span className="page-link">
                                                    →
                                                </span>

                                            ) : (

                                                <Link
                                                    className="page-link"
                                                    href={buildPageUrl({
                                                        search,
                                                        category,
                                                        brand,
                                                        page: currentPage + 1,
                                                        limit
                                                    })}
                                                    aria-label="Next page"
                                                >
                                                    →
                                                </Link>

                                            )}

                                        </li>

                                    </ul>

                                </nav>

                            )}

                        </div>

                    </div>

                </div>

            </div>

        </main>
    );
}