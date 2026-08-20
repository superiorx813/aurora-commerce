"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";


// ---------------------------------------------------------
// Product type
// ---------------------------------------------------------

type Product = {
    id: number;

    name: string;
    slug: string;

    sku: string | null;

    product_type: string | null;

    category_name: string | null;

    price: number | string;
    mrp: number | string;

    stock: number;

    brand: string | null;

    image_url: string | null;

    featured: number;

    status: "DRAFT" | "ACTIVE" | "ARCHIVED";

    created_at: string;
};


// ---------------------------------------------------------
// Helper: format money
// ---------------------------------------------------------

function formatMoney(value: number | string) {

    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "₹0";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}


// ---------------------------------------------------------
// Admin Products Page
// ---------------------------------------------------------

export default function AdminProductsPage() {

    // -----------------------------------------------------
    // State
    // -----------------------------------------------------

    const [products, setProducts] = useState<Product[]>([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState("ALL");

    const [categoryFilter, setCategoryFilter] = useState("ALL");


    // -----------------------------------------------------
    // Load products
    // -----------------------------------------------------

    async function loadProducts() {

        try {

            setLoading(true);

            setError("");

            const response = await fetch(
                "/api/admin/products",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to load products."
                );
            }


            setProducts(
                Array.isArray(data.products)
                    ? data.products
                    : []
            );

        } catch (err: any) {

            console.error(
                "PRODUCT LOAD ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to load products."
            );

        } finally {

            setLoading(false);
        }
    }


    // -----------------------------------------------------
    // Load products on page load
    // -----------------------------------------------------

    useEffect(() => {

        loadProducts();

    }, []);


    // -----------------------------------------------------
    // Get unique categories
    // -----------------------------------------------------

    const categories = useMemo(() => {

        const values = products
            .map(product => product.category_name)
            .filter(
                (value): value is string =>
                    Boolean(value)
            );


        return Array.from(
            new Set(values)
        ).sort();

    }, [products]);


    // -----------------------------------------------------
    // Filter products
    // -----------------------------------------------------

    const filteredProducts = useMemo(() => {

        const searchValue =
            search.trim().toLowerCase();


        return products.filter(product => {

            // ---------------------------------------------
            // Search
            // ---------------------------------------------

            const matchesSearch =
                !searchValue ||
                product.name
                    .toLowerCase()
                    .includes(searchValue) ||
                product.slug
                    .toLowerCase()
                    .includes(searchValue) ||
                (product.brand || "")
                    .toLowerCase()
                    .includes(searchValue) ||
                (product.sku || "")
                    .toLowerCase()
                    .includes(searchValue);


            // ---------------------------------------------
            // Status
            // ---------------------------------------------

            const matchesStatus =
                statusFilter === "ALL" ||
                product.status === statusFilter;


            // ---------------------------------------------
            // Category
            // ---------------------------------------------

            const matchesCategory =
                categoryFilter === "ALL" ||
                product.category_name === categoryFilter;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesCategory
            );
        });

    }, [
        products,
        search,
        statusFilter,
        categoryFilter
    ]);


    // -----------------------------------------------------
    // Statistics
    // -----------------------------------------------------

    const totalProducts = products.length;

    const activeProducts =
        products.filter(
            product => product.status === "ACTIVE"
        ).length;

    const draftProducts =
        products.filter(
            product => product.status === "DRAFT"
        ).length;

    const lowStockProducts =
        products.filter(
            product => product.stock < 10
        ).length;


    // -----------------------------------------------------
    // Render
    // -----------------------------------------------------

    return (
        <main className="container page-shell">

            {/* ------------------------------------------------
                PAGE HEADER
            ------------------------------------------------ */}

            <div className="admin-products-header">

                <div>

                    <span className="eyebrow">
                        AURORA CONTROL
                    </span>

                    <h1>
                        Products
                    </h1>

                    <p>
                        Manage your complete product catalog
                        from one workspace.
                    </p>

                </div>


                <Link
                    href="/admin/products/new"
                    className="admin-add-product-btn"
                >
                    <span>＋</span>
                    Add Product
                </Link>

            </div>


            {/* ------------------------------------------------
                STATISTICS
            ------------------------------------------------ */}

            <div className="admin-product-stats">

                <div className="admin-product-stat">

                    <span>
                        Total Products
                    </span>

                    <strong>
                        {totalProducts}
                    </strong>

                </div>


                <div className="admin-product-stat">

                    <span>
                        Active
                    </span>

                    <strong>
                        {activeProducts}
                    </strong>

                </div>


                <div className="admin-product-stat">

                    <span>
                        Drafts
                    </span>

                    <strong>
                        {draftProducts}
                    </strong>

                </div>


                <div className="admin-product-stat">

                    <span>
                        Low Stock
                    </span>

                    <strong>
                        {lowStockProducts}
                    </strong>

                </div>

            </div>


            {/* ------------------------------------------------
                ERROR
            ------------------------------------------------ */}

            {error && (

                <div className="admin-error">

                    {error}

                </div>

            )}


            {/* ------------------------------------------------
                FILTER BAR
            ------------------------------------------------ */}

            <section className="admin-products-panel">

                <div className="admin-products-toolbar">

                    {/* Search */}

                    <div className="admin-product-search">

                        <span>
                            ⌕
                        </span>

                        <input
                            type="text"
                            placeholder="Search products, SKU or brand..."
                            value={search}
                            onChange={event =>
                                setSearch(event.target.value)
                            }
                        />

                    </div>


                    {/* Category */}

                    <select
                        value={categoryFilter}
                        onChange={event =>
                            setCategoryFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All categories
                        </option>

                        {categories.map(category => (

                            <option
                                key={category}
                                value={category}
                            >
                                {category}
                            </option>

                        ))}

                    </select>


                    {/* Status */}

                    <select
                        value={statusFilter}
                        onChange={event =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All status
                        </option>

                        <option value="ACTIVE">
                            Active
                        </option>

                        <option value="DRAFT">
                            Draft
                        </option>

                        <option value="ARCHIVED">
                            Archived
                        </option>

                    </select>

                </div>


                {/* ------------------------------------------------
                    TABLE
                ------------------------------------------------ */}

                <div className="admin-products-table-wrapper">

                    {loading ? (

                        <div className="admin-products-loading">

                            <div className="admin-loading-spinner" />

                            <span>
                                Loading products...
                            </span>

                        </div>

                    ) : filteredProducts.length === 0 ? (

                        <div className="admin-products-empty">

                            <div>
                                ✦
                            </div>

                            <h3>
                                No products found
                            </h3>

                            <p>
                                Try changing your search
                                or filters.
                            </p>

                            <Link
                                href="/admin/products/new"
                                className="btn-ghost"
                            >
                                Add your first product →
                            </Link>

                        </div>

                    ) : (

                        <table className="admin-products-table">

                            <thead>

                                <tr>

                                    <th>
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

                                    <th>
                                        SKU
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredProducts.map(
                                    product => (

                                        <tr
                                            key={product.id}
                                        >

                                            {/* Product */}

                                            <td>

                                                <div className="admin-product-info">

                                                    <div className="admin-product-image">

                                                        {product.image_url ? (

                                                            <img
                                                                src={
                                                                    product.image_url
                                                                }
                                                                alt={
                                                                    product.name
                                                                }
                                                            />

                                                        ) : (

                                                            <span>
                                                                ✦
                                                            </span>

                                                        )}

                                                    </div>


                                                    <div>

                                                        <strong>
                                                            {product.name}
                                                        </strong>

                                                        <small>
                                                            {product.brand ||
                                                                "No brand"}
                                                        </small>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* Category */}

                                            <td>

                                                <span className="admin-category">

                                                    {product.category_name ||
                                                        "Uncategorized"}

                                                </span>

                                            </td>


                                            {/* Price */}

                                            <td>

                                                <div className="admin-price">

                                                    <strong>
                                                        {formatMoney(
                                                            product.price
                                                        )}
                                                    </strong>

                                                    {Number(
                                                        product.mrp
                                                    ) >
                                                        Number(
                                                            product.price
                                                        ) && (

                                                        <del>
                                                            {formatMoney(
                                                                product.mrp
                                                            )}
                                                        </del>

                                                    )}

                                                </div>

                                            </td>


                                            {/* Stock */}

                                            <td>

                                                <span
                                                    className={
                                                        product.stock < 10
                                                            ? "admin-stock low"
                                                            : "admin-stock"
                                                    }
                                                >

                                                    {product.stock}

                                                </span>

                                            </td>


                                            {/* Status */}

                                            <td>

                                                <span
                                                    className={
                                                        `admin-status ${product.status.toLowerCase()}`
                                                    }
                                                >

                                                    {product.status}

                                                </span>

                                            </td>


                                            {/* SKU */}

                                            <td>

                                                <span className="admin-sku">

                                                    {product.sku ||
                                                        "—"}

                                                </span>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    )}

                </div>

            </section>


            {/* ------------------------------------------------
                FOOTER
            ------------------------------------------------ */}

            {!loading &&
                filteredProducts.length > 0 && (

                <div className="admin-products-footer">

                    Showing{" "}

                    <strong>
                        {filteredProducts.length}
                    </strong>

                    {" "}of{" "}

                    <strong>
                        {products.length}
                    </strong>

                    {" "}products

                </div>

            )}

        </main>
    );
}