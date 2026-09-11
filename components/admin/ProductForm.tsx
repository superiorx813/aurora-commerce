"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";


// =========================================================
// TYPES
// =========================================================

type ProductType =
    | "fashion"
    | "electronics"
    | "shoes"
    | "beauty"
    | "grocery"
    | "home"
    | "other";


type Specification = {
    specification_group: string;
    specification_key: string;
    specification_value: string;
};


type FormData = {
    product_type: ProductType;

    name: string;
    brand: string;
    description: string;
    short_description: string;

    category_id: string;

    sku: string;
    slug: string;

    price: string;
    mrp: string;

    stock: string;

    featured: boolean;

    status: "DRAFT" | "ACTIVE";

    weight: string;
    length: string;
    width: string;
    height: string;

    free_shipping: boolean;
    cod_available: boolean;

    return_available: boolean;
    return_days: string;

    seo_title: string;
    meta_description: string;
    seo_keywords: string;
    canonical_url: string;
};


type ProductFormProps = {
    mode: "create" | "edit";
    product?: any;
};


// =========================================================
// PRODUCT TYPES
// =========================================================

const PRODUCT_TYPES: {
    value: ProductType;
    label: string;
    icon: string;
    description: string;
}[] = [

    {
        value: "fashion",
        label: "Fashion",
        icon: "✦",
        description: "Clothing & apparel"
    },

    {
        value: "electronics",
        label: "Electronics",
        icon: "⌁",
        description: "Phones, laptops & gadgets"
    },

    {
        value: "shoes",
        label: "Shoes",
        icon: "◈",
        description: "Footwear & sneakers"
    },

    {
        value: "beauty",
        label: "Beauty",
        icon: "◇",
        description: "Beauty & personal care"
    },

    {
        value: "grocery",
        label: "Grocery",
        icon: "○",
        description: "Food & daily essentials"
    },

    {
        value: "home",
        label: "Home",
        icon: "⌂",
        description: "Furniture & home"
    },

    {
        value: "other",
        label: "Other",
        icon: "＋",
        description: "Other products"
    }

];


// =========================================================
// SPECIFICATION FIELDS
// =========================================================

const SPECIFICATION_FIELDS: Record<
    ProductType,
    {
        group: string;
        key: string;
    }[]
> = {

    fashion: [
        { group: "General", key: "Gender" },
        { group: "General", key: "Fabric" },
        { group: "General", key: "Color" },
        { group: "General", key: "Size" },
        { group: "General", key: "Fit" },
        { group: "General", key: "Pattern" },
        { group: "General", key: "Occasion" },
        { group: "Care", key: "Wash Care" }
    ],

    electronics: [
        { group: "General", key: "Model Number" },
        { group: "General", key: "Color" },
        { group: "Performance", key: "Processor" },
        { group: "Performance", key: "RAM" },
        { group: "Performance", key: "Storage" },
        { group: "Display", key: "Screen Size" },
        { group: "Battery", key: "Battery Capacity" },
        { group: "Connectivity", key: "Connectivity" },
        { group: "Warranty", key: "Warranty" }
    ],

    shoes: [
        { group: "General", key: "Gender" },
        { group: "General", key: "Shoe Type" },
        { group: "General", key: "Color" },
        { group: "General", key: "Size" },
        { group: "Material", key: "Upper Material" },
        { group: "Material", key: "Sole Material" },
        { group: "Design", key: "Closure" },
        { group: "Design", key: "Occasion" }
    ],

    beauty: [
        { group: "General", key: "Skin Type" },
        { group: "General", key: "Concern" },
        { group: "General", key: "Form" },
        { group: "General", key: "Net Quantity" },
        { group: "Ingredients", key: "Ingredients" },
        { group: "General", key: "Fragrance" },
        { group: "Origin", key: "Country of Origin" }
    ],

    grocery: [
        { group: "General", key: "Net Weight" },
        { group: "General", key: "Pack Size" },
        { group: "General", key: "Pack Type" },
        { group: "Ingredients", key: "Ingredients" },
        { group: "General", key: "Vegetarian" },
        { group: "Origin", key: "Country of Origin" }
    ],

    home: [
        { group: "General", key: "Material" },
        { group: "General", key: "Color" },
        { group: "General", key: "Dimensions" },
        { group: "General", key: "Room Type" },
        { group: "General", key: "Assembly Required" },
        { group: "Warranty", key: "Warranty" }
    ],

    other: [
        { group: "General", key: "Color" },
        { group: "General", key: "Material" },
        { group: "General", key: "Country of Origin" }
    ]

};


// =========================================================
// INITIAL FORM
// =========================================================

const INITIAL_FORM: FormData = {

    product_type: "fashion",

    name: "",
    brand: "",
    description: "",
    short_description: "",

    category_id: "",

    sku: "",
    slug: "",

    price: "",
    mrp: "",

    stock: "0",

    featured: false,

    status: "DRAFT",

    weight: "",
    length: "",
    width: "",
    height: "",

    free_shipping: false,
    cod_available: true,

    return_available: true,
    return_days: "7",

    seo_title: "",
    meta_description: "",
    seo_keywords: "",
    canonical_url: ""

};


// =========================================================
// HELPERS
// =========================================================

function toStringValue(value: any): string {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value);
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


function normalizeProductType(
    value: any
): ProductType {

    const allowed: ProductType[] = [
        "fashion",
        "electronics",
        "shoes",
        "beauty",
        "grocery",
        "home",
        "other"
    ];

    return allowed.includes(value)
        ? value
        : "other";
}


// =========================================================
// INITIAL PRODUCT DATA
// =========================================================

function buildInitialForm(
    product?: any
): FormData {

    if (!product) {
        return {
            ...INITIAL_FORM
        };
    }

    return {

        product_type:
            normalizeProductType(
                product.product_type
            ),

        name:
            toStringValue(
                product.name
            ),

        brand:
            toStringValue(
                product.brand
            ),

        description:
            toStringValue(
                product.description
            ),

        short_description:
            toStringValue(
                product.short_description
            ),

        category_id:
            toStringValue(
                product.category_id
            ),

        sku:
            toStringValue(
                product.sku
            ),

        slug:
            toStringValue(
                product.slug
            ),

        price:
            toStringValue(
                product.price
            ),

        mrp:
            toStringValue(
                product.mrp
            ),

        stock:
            toStringValue(
                product.stock
            ),

        featured:
            toBoolean(
                product.featured,
                false
            ),

        status:
            product.status === "ACTIVE"
                ? "ACTIVE"
                : "DRAFT",

        weight:
            toStringValue(
                product.weight
            ),

        length:
            toStringValue(
                product.length
            ),

        width:
            toStringValue(
                product.width
            ),

        height:
            toStringValue(
                product.height
            ),

        free_shipping:
            toBoolean(
                product.free_shipping,
                false
            ),

        cod_available:
            toBoolean(
                product.cod_available,
                true
            ),

        return_available:
            toBoolean(
                product.return_available,
                true
            ),

        return_days:
            toStringValue(
                product.return_days
            ) || "7",

        seo_title:
            toStringValue(
                product.seo_title
            ),

        meta_description:
            toStringValue(
                product.meta_description
            ),

        seo_keywords:
            toStringValue(
                product.seo_keywords
            ),

        canonical_url:
            toStringValue(
                product.canonical_url
            )

    };

}


// =========================================================
// COMPONENT
// =========================================================

export default function ProductForm({
    mode,
    product
}: ProductFormProps) {

    const router = useRouter();


    // =====================================================
    // STATE
    // =====================================================

    const [form, setForm] =
        useState<FormData>(
            () =>
                buildInitialForm(
                    product
                )
        );


    const [step, setStep] =
        useState(1);


    const [saving, setSaving] =
        useState(false);


    const [error, setError] =
        useState("");


    const [success, setSuccess] =
        useState("");


    // =====================================================
    // IMPORTANT IMAGE STATE
    //
    // Primary image and gallery input are intentionally
    // kept separate.
    // =====================================================

    const [imageUrl, setImageUrl] =
        useState(
            toStringValue(
                product?.image_url
            ).trim()
        );


    const [galleryInputUrl, setGalleryInputUrl] =
        useState("");


    const [galleryUrls, setGalleryUrls] =
        useState<string[]>(() => {

            if (
                Array.isArray(
                    product?.gallery_json
                )
            ) {

                return product.gallery_json
                    .map(
                        (item: any) =>
                            toStringValue(item).trim()
                    )
                    .filter(
                        (item: string) =>
                            item.length > 0
                    );

            }


            if (
                typeof product?.gallery_json ===
                "string"
            ) {

                try {

                    const parsed =
                        JSON.parse(
                            product.gallery_json
                        );

                    if (
                        Array.isArray(parsed)
                    ) {

                        return parsed
                            .map(
                                (item: any) =>
                                    toStringValue(item).trim()
                            )
                            .filter(
                                (item: string) =>
                                    item.length > 0
                            );

                    }

                } catch {

                    return [];

                }

            }


            return [];

        });


    const [specifications, setSpecifications] =
        useState<Specification[]>(() => {

            if (
                Array.isArray(
                    product?.specifications
                )
            ) {

                return product.specifications;

            }

            return [];

        });


    // =====================================================
    // UPDATE FIELD
    // =====================================================

    function updateField(
        field: keyof FormData,
        value: string | boolean
    ) {

        setForm(previous => ({
            ...previous,
            [field]: value
        }));

    }


    // =====================================================
    // PRODUCT TYPE
    // =====================================================

    function changeProductType(
        type: ProductType
    ) {

        updateField(
            "product_type",
            type
        );

        setSpecifications([]);

    }


    const specificationFields =
        useMemo(
            () =>
                SPECIFICATION_FIELDS[
                    form.product_type
                ],
            [
                form.product_type
            ]
        );


    // =====================================================
    // SPECIFICATIONS
    // =====================================================

    function updateSpecification(
        key: string,
        value: string
    ) {

        setSpecifications(previous => {

            const existing =
                previous.find(
                    item =>
                        item.specification_key ===
                        key
                );


            if (existing) {

                return previous.map(
                    item =>
                        item.specification_key ===
                        key
                            ? {
                                ...item,
                                specification_value:
                                    value
                            }
                            : item
                );

            }


            const field =
                specificationFields.find(
                    item =>
                        item.key ===
                        key
                );


            return [
                ...previous,
                {
                    specification_group:
                        field?.group ||
                        "General",

                    specification_key:
                        key,

                    specification_value:
                        value
                }
            ];

        });

    }


    function getSpecificationValue(
        key: string
    ): string {

        return (
            specifications.find(
                item =>
                    item.specification_key ===
                    key
            )?.specification_value ||
            ""
        );

    }


    // =====================================================
    // GALLERY
    // =====================================================

    function addGalleryImage() {

        const value =
            galleryInputUrl.trim();


        if (!value) {
            return;
        }


        setGalleryUrls(
            previous => {

                if (
                    previous.includes(value)
                ) {
                    return previous;
                }

                return [
                    ...previous,
                    value
                ];

            }
        );


        // IMPORTANT:
        // Clear only the gallery input.
        // Never clear the primary image.
        setGalleryInputUrl("");

    }


    function removeGalleryImage(
        index: number
    ) {

        setGalleryUrls(
            previous =>
                previous.filter(
                    (_, itemIndex) =>
                        itemIndex !== index
                )
        );

    }


    // =====================================================
    // VALIDATION
    // =====================================================

    function validateStep(): boolean {

        setError("");


        if (step === 1) {

            if (!form.name.trim()) {

                setError(
                    "Product name is required."
                );

                return false;

            }


            if (!form.brand.trim()) {

                setError(
                    "Brand is required."
                );

                return false;

            }


            if (!form.category_id.trim()) {

                setError(
                    "Category ID is required."
                );

                return false;

            }


            if (
                !/^\d+$/.test(
                    form.category_id.trim()
                )
            ) {

                setError(
                    "Category ID must be a valid number."
                );

                return false;

            }


            if (!form.sku.trim()) {

                setError(
                    "SKU is required."
                );

                return false;

            }


            if (!form.slug.trim()) {

                setError(
                    "Product slug is required."
                );

                return false;

            }

        }


        if (step === 2) {

            const price =
                Number(form.price);


            const mrp =
                Number(form.mrp);


            const stock =
                Number(form.stock);


            if (
                !Number.isFinite(price) ||
                price <= 0
            ) {

                setError(
                    "Enter a valid selling price."
                );

                return false;

            }


            if (
                !Number.isFinite(mrp) ||
                mrp <= 0
            ) {

                setError(
                    "Enter a valid MRP."
                );

                return false;

            }


            if (price > mrp) {

                setError(
                    "Selling price cannot be greater than MRP."
                );

                return false;

            }


            if (
                !Number.isInteger(stock) ||
                stock < 0
            ) {

                setError(
                    "Enter a valid stock quantity."
                );

                return false;

            }

        }


        return true;

    }


    // =====================================================
    // NEXT STEP
    // =====================================================

    function nextStep() {

        if (!validateStep()) {
            return;
        }


        setStep(
            current =>
                Math.min(
                    current + 1,
                    7
                )
        );

    }


    // =====================================================
    // PREVIOUS STEP
    // =====================================================

    function previousStep() {

        setError("");


        setStep(
            current =>
                Math.max(
                    current - 1,
                    1
                )
        );

    }


    // =====================================================
    // SAVE PRODUCT
    // =====================================================

    async function saveProduct() {

        setError("");
        setSuccess("");


        const originalStep =
            step;


        // -------------------------------------------------
        // Validate Basic + Pricing before publishing
        // -------------------------------------------------

        if (step === 7) {

            setStep(1);

            const basicValid =
                validateStep();


            if (!basicValid) {

                setStep(1);

                return;

            }


            setStep(2);

            const pricingValid =
                validateStep();


            if (!pricingValid) {

                setStep(2);

                return;

            }


            setStep(7);

        } else {

            if (!validateStep()) {
                return;
            }

            setStep(originalStep);

        }


        // -------------------------------------------------
        // Product ID for edit
        // -------------------------------------------------

        if (
            mode === "edit" &&
            (
                !product?.id ||
                Number(product.id) <= 0
            )
        ) {

            setError(
                "Product ID is missing. Unable to update this product."
            );

            return;

        }


        try {

            setSaving(true);


            // =================================================
            // CLEAN PRIMARY IMAGE
            // =================================================

            const cleanImageUrl =
                imageUrl.trim();


            // =================================================
            // CLEAN GALLERY
            // =================================================

            const cleanGalleryUrls =
                galleryUrls
                    .map(
                        url =>
                            url.trim()
                    )
                    .filter(
                        url =>
                            url.length > 0
                    );


            // =================================================
            // CLEAN SPECIFICATIONS
            // =================================================

            const cleanSpecifications =
                specifications
                    .filter(
                        item =>
                            item &&
                            item.specification_key &&
                            item.specification_value?.trim()
                    )
                    .map(
                        item => ({

                            specification_group:
                                item.specification_group ||
                                "General",

                            specification_key:
                                item.specification_key
                                    .trim(),

                            specification_value:
                                item.specification_value
                                    .trim()

                        })
                    );


            // =================================================
            // PAYLOAD
            // =================================================

            const payload = {

                product_type:
                    form.product_type,

                name:
                    form.name.trim(),

                brand:
                    form.brand.trim(),

                description:
                    form.description.trim(),

                short_description:
                    form.short_description.trim(),

                category_id:
                    Number(
                        form.category_id
                    ),

                sku:
                    form.sku.trim(),

                slug:
                    createSlug(
                        form.slug
                    ),

                price:
                    Number(
                        form.price
                    ),

                mrp:
                    Number(
                        form.mrp
                    ),

                stock:
                    Number(
                        form.stock
                    ),

                featured:
                    Boolean(
                        form.featured
                    ),

                status:
                    form.status,

                // =================================================
                // IMPORTANT:
                // Primary image is saved separately.
                // =================================================

                image_url:
                    cleanImageUrl ||
                    null,

                gallery_json:
                    cleanGalleryUrls.length > 0
                        ? JSON.stringify(
                            cleanGalleryUrls
                        )
                        : null,

                gallery_urls:
                    cleanGalleryUrls,

                specifications:
                    cleanSpecifications,

                shipping: {

                    weight:
                        form.weight
                            ? Number(
                                form.weight
                            )
                            : null,

                    length:
                        form.length
                            ? Number(
                                form.length
                            )
                            : null,

                    width:
                        form.width
                            ? Number(
                                form.width
                            )
                            : null,

                    height:
                        form.height
                            ? Number(
                                form.height
                            )
                            : null,

                    free_shipping:
                        Boolean(
                            form.free_shipping
                        ),

                    cod_available:
                        Boolean(
                            form.cod_available
                        ),

                    return_available:
                        Boolean(
                            form.return_available
                        ),

                    return_days:
                        form.return_days
                            ? Number(
                                form.return_days
                            )
                            : 7

                },

                seo: {

                    seo_title:
                        form.seo_title.trim(),

                    meta_description:
                        form.meta_description.trim(),

                    seo_keywords:
                        form.seo_keywords.trim(),

                    canonical_url:
                        form.canonical_url.trim()

                }

            };


            // =================================================
            // DEBUG
            // =================================================

            console.log(
                "[PRODUCT FORM] PRIMARY IMAGE:",
                cleanImageUrl
            );

            console.log(
                "[PRODUCT FORM] GALLERY:",
                cleanGalleryUrls
            );


            // =================================================
            // API URL
            // =================================================

            const url =
                mode === "edit"
                    ? `/api/admin/products/${product.id}`
                    : "/api/admin/products";


            // =================================================
            // HTTP METHOD
            // =================================================

            const method =
                mode === "edit"
                    ? "PUT"
                    : "POST";


            console.log(
                `[PRODUCT FORM] ${method} ${url}`
            );


            // =================================================
            // REQUEST
            // =================================================

            const response =
                await fetch(
                    url,
                    {
                        method,

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                payload
                            )

                    }
                );


            // =================================================
            // READ RESPONSE TEXT FIRST
            // =================================================

            const responseText =
                await response.text();


            let data: any = {};


            if (
                responseText.trim()
            ) {

                try {

                    data =
                        JSON.parse(
                            responseText
                        );

                } catch {

                    data = {
                        error:
                            responseText
                    };

                }

            }


            // =================================================
            // SERVER ERROR
            // =================================================

            if (!response.ok) {

                const serverMessage =
                    data?.error ||
                    data?.message ||
                    `Request failed with status ${response.status}.`;


                throw new Error(
                    serverMessage
                );

            }


            // =================================================
            // SUCCESS
            // =================================================

            console.log(
                `[PRODUCT FORM] ${method} SUCCESS`,
                data
            );


            if (
                mode === "edit"
            ) {

                setSuccess(
                    "Product updated successfully. Redirecting..."
                );

            } else {

                setSuccess(
                    "Product created successfully. Redirecting..."
                );

            }


            // =================================================
            // REDIRECT
            // =================================================

            setTimeout(
                () => {

                    router.push(
                        "/admin/products"
                    );

                    router.refresh();

                },
                500
            );


        } catch (err: any) {

            console.error(
                mode === "edit"
                    ? "UPDATE PRODUCT ERROR:"
                    : "CREATE PRODUCT ERROR:",
                err
            );


            setError(
                err?.message ||
                (
                    mode === "edit"
                        ? "Unable to update product."
                        : "Unable to create product."
                )
            );


        } finally {

            setSaving(false);

        }

    }


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="container page-shell">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="new-product-header">

                <div>

                    <Link
                        href="/admin/products"
                        className="new-product-back"
                    >
                        ← Back to products
                    </Link>


                    <span className="eyebrow">
                        AURORA CONTROL
                    </span>


                    <h1>
                        {mode === "edit"
                            ? "Edit Product"
                            : "Add Product"}
                    </h1>


                    <p>
                        {mode === "edit"
                            ? "Update your Aurora product information."
                            : "Create a new product for your Aurora storefront."}
                    </p>

                </div>

            </div>


            {/* =================================================
                STEP NAVIGATION
            ================================================= */}

            <div className="product-form-steps">

                {[
                    "Basic",
                    "Pricing",
                    "Media",
                    "Specifications",
                    "Shipping",
                    "SEO",
                    "Publish"
                ].map(
                    (
                        label,
                        index
                    ) => {

                        const number =
                            index + 1;


                        return (

                            <button
                                type="button"
                                key={label}
                                className={
                                    number === step
                                        ? "active"
                                        : number < step
                                            ? "completed"
                                            : ""
                                }
                                onClick={() => {

                                    if (
                                        number < step
                                    ) {

                                        setError("");

                                        setStep(
                                            number
                                        );

                                    }

                                }}
                            >

                                <span>
                                    {number}
                                </span>

                                <label>
                                    {label}
                                </label>

                            </button>

                        );

                    }
                )}

            </div>


            {/* =================================================
                MESSAGES
            ================================================= */}

            {error && (

                <div className="new-product-error">
                    {error}
                </div>

            )}


            {success && (

                <div className="new-product-success">
                    {success}
                </div>

            )}


            {/* =================================================
                FORM
            ================================================= */}

            <section className="new-product-form">


                {/* =================================================
                    STEP 1
                ================================================= */}

                {step === 1 && (

                    <div className="product-form-section">

                        <div className="product-form-section-heading">

                            <div>

                                <span>
                                    01
                                </span>

                                <h2>
                                    Basic Information
                                </h2>

                                <p>
                                    Tell Aurora what you're selling.
                                </p>

                            </div>

                        </div>


                        <div className="form-field">

                            <label>
                                Product Type
                            </label>


                            <div className="product-type-grid">

                                {PRODUCT_TYPES.map(
                                    type => (

                                        <button
                                            type="button"
                                            key={type.value}
                                            className={
                                                form.product_type ===
                                                type.value
                                                    ? "selected"
                                                    : ""
                                            }
                                            onClick={() =>
                                                changeProductType(
                                                    type.value
                                                )
                                            }
                                        >

                                            <strong>
                                                {type.icon}
                                            </strong>

                                            <span>
                                                {type.label}
                                            </span>

                                            <small>
                                                {type.description}
                                            </small>

                                        </button>

                                    )
                                )}

                            </div>

                        </div>


                        <div className="form-grid-2">

                            <div className="form-field">

                                <label>
                                    Product Name *
                                </label>

                                <input
                                    value={form.name}
                                    onChange={event => {

                                        const value =
                                            event.target.value;


                                        updateField(
                                            "name",
                                            value
                                        );


                                        if (
                                            mode === "create" ||
                                            !product?.slug
                                        ) {

                                            updateField(
                                                "slug",
                                                createSlug(
                                                    value
                                                )
                                            );

                                        }

                                    }}
                                    placeholder="Example: Aurora Premium Sneakers"
                                />

                            </div>


                            <div className="form-field">

                                <label>
                                    Brand *
                                </label>

                                <input
                                    value={form.brand}
                                    onChange={event =>
                                        updateField(
                                            "brand",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Example: Aurora"
                                />

                            </div>

                        </div>


                        <div className="form-grid-2">

                            <div className="form-field">

                                <label>
                                    Category ID *
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    value={form.category_id}
                                    onChange={event =>
                                        updateField(
                                            "category_id",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Example: 4"
                                />

                                <small className="field-help">
                                    Enter an existing category ID.
                                </small>

                            </div>


                            <div className="form-field">

                                <label>
                                    SKU *
                                </label>

                                <input
                                    value={form.sku}
                                    onChange={event =>
                                        updateField(
                                            "sku",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Example: AUR-SHOE-001"
                                />

                            </div>

                        </div>


                        <div className="form-grid-2">

                            <div className="form-field">

                                <label>
                                    Product Slug *
                                </label>

                                <input
                                    value={form.slug}
                                    onChange={event =>
                                        updateField(
                                            "slug",
                                            createSlug(
                                                event.target.value
                                            )
                                        )
                                    }
                                    placeholder="aurora-premium-sneakers"
                                />

                            </div>


                            <div className="form-field">

                                <label>
                                    Short Description
                                </label>

                                <input
                                    value={
                                        form.short_description
                                    }
                                    maxLength={500}
                                    onChange={event =>
                                        updateField(
                                            "short_description",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Short product summary"
                                />

                            </div>

                        </div>


                        <div className="form-field">

                            <label>
                                Product Description
                            </label>

                            <textarea
                                value={form.description}
                                onChange={event =>
                                    updateField(
                                        "description",
                                        event.target.value
                                    )
                                }
                                rows={7}
                                placeholder="Describe the product, its benefits, features and important details..."
                            />

                        </div>

                    </div>

                )}


                {/* =================================================
                    STEP 2
                ================================================= */}

                {step === 2 && (

                    <div className="product-form-section">

                        <div className="product-form-section-heading">

                            <div>

                                <span>
                                    02
                                </span>

                                <h2>
                                    Pricing & Inventory
                                </h2>

                                <p>
                                    Configure pricing, stock and availability.
                                </p>

                            </div>

                        </div>


                        <div className="form-grid-3">

                            <div className="form-field">

                                <label>
                                    Selling Price *
                                </label>

                                <div className="input-prefix">

                                    <span>
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        value={form.price}
                                        onChange={event =>
                                            updateField(
                                                "price",
                                                event.target.value
                                            )
                                        }
                                        placeholder="0"
                                    />

                                </div>

                            </div>


                            <div className="form-field">

                                <label>
                                    MRP *
                                </label>

                                <div className="input-prefix">

                                    <span>
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        value={form.mrp}
                                        onChange={event =>
                                            updateField(
                                                "mrp",
                                                event.target.value
                                            )
                                        }
                                        placeholder="0"
                                    />

                                </div>

                            </div>


                            <div className="form-field">

                                <label>
                                    Stock *
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    value={form.stock}
                                    onChange={event =>
                                        updateField(
                                            "stock",
                                            event.target.value
                                        )
                                    }
                                    placeholder="0"
                                />

                            </div>

                        </div>


                        <div className="price-preview">

                            <div>

                                <span>
                                    Selling price
                                </span>

                                <strong>
                                    ₹
                                    {Number(
                                        form.price || 0
                                    ).toLocaleString(
                                        "en-IN"
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    MRP
                                </span>

                                <del>
                                    ₹
                                    {Number(
                                        form.mrp || 0
                                    ).toLocaleString(
                                        "en-IN"
                                    )}
                                </del>

                            </div>


                            <div>

                                <span>
                                    Discount
                                </span>

                                <strong>

                                    {Number(form.mrp) > 0
                                        ? Math.max(
                                            0,
                                            Math.round(
                                                (
                                                    1 -
                                                    Number(
                                                        form.price
                                                    ) /
                                                    Number(
                                                        form.mrp
                                                    )
                                                ) *
                                                100
                                            )
                                        )
                                        : 0
                                    }%

                                </strong>

                            </div>

                        </div>


                        <div className="form-toggle-grid">

                            <label className="form-toggle">

                                <input
                                    type="checkbox"
                                    checked={
                                        form.featured
                                    }
                                    onChange={event =>
                                        updateField(
                                            "featured",
                                            event.target.checked
                                        )
                                    }
                                />

                                <span />

                                <div>

                                    <strong>
                                        Featured Product
                                    </strong>

                                    <small>
                                        Show this product in featured sections.
                                    </small>

                                </div>

                            </label>


                            <label className="form-toggle">

                                <input
                                    type="checkbox"
                                    checked={
                                        form.status ===
                                        "ACTIVE"
                                    }
                                    onChange={event =>
                                        updateField(
                                            "status",
                                            event.target.checked
                                                ? "ACTIVE"
                                                : "DRAFT"
                                        )
                                    }
                                />

                                <span />

                                <div>

                                    <strong>
                                        Publish Product
                                    </strong>

                                    <small>
                                        Make this product visible on the storefront.
                                    </small>

                                </div>

                            </label>

                        </div>

                    </div>

                )}


                {/* =================================================
                    STEP 3 - MEDIA
                ================================================= */}

                {step === 3 && (

                    <div className="product-form-section">

                        <div className="product-form-section-heading">

                            <div>

                                <span>
                                    03
                                </span>

                                <h2>
                                    Product Media
                                </h2>

                                <p>
                                    Add the product's main image and gallery.
                                </p>

                            </div>

                        </div>


                        {/* =================================================
                            PRIMARY IMAGE
                        ================================================= */}

                        <div className="media-main-field">

                            <label>
                                Primary Image URL
                            </label>

                            <input
                                type="text"
                                value={imageUrl}
                                onChange={event =>
                                    setImageUrl(
                                        event.target.value
                                    )
                                }
                                placeholder="https://example.com/product-image.jpg"
                            />

                            <small>
                                This image will be used as the main product image.
                            </small>

                        </div>


                        {/* =================================================
                            PRIMARY IMAGE PREVIEW
                        ================================================= */}

                        {imageUrl.trim() && (

                            <div className="primary-image-preview">

                                <img
                                    src={imageUrl.trim()}
                                    alt={
                                        form.name ||
                                        "Product preview"
                                    }
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block"
                                    }}
                                />

                            </div>

                        )}


                        {/* =================================================
                            GALLERY
                        ================================================= */}

                        <div className="gallery-field">

                            <label>
                                Gallery Images
                            </label>

                            <div className="gallery-add-row">

                                <input
                                    type="text"
                                    value={galleryInputUrl}
                                    onChange={event =>
                                        setGalleryInputUrl(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Paste another image URL"
                                />

                                <button
                                    type="button"
                                    onClick={
                                        addGalleryImage
                                    }
                                >
                                    Add Image
                                </button>

                            </div>

                        </div>


                        {/* =================================================
                            GALLERY PREVIEW
                        ================================================= */}

                        {galleryUrls.length > 0 && (

                            <div className="gallery-preview-grid">

                                {galleryUrls.map(
                                    (
                                        url,
                                        index
                                    ) => (

                                        <div
                                            key={`${url}-${index}`}
                                            className="gallery-preview"
                                        >

                                            <img
                                                src={url}
                                                alt={
                                                    `Gallery ${index + 1}`
                                                }
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block"
                                                }}
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeGalleryImage(
                                                        index
                                                    )
                                                }
                                            >
                                                ×
                                            </button>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>

                )}


                {/* =================================================
                    STEP 4
                ================================================= */}

                {step === 4 && (

                    <div className="product-form-section">

                        <div className="product-form-section-heading">

                            <div>

                                <span>
                                    04
                                </span>

                                <h2>
                                    {PRODUCT_TYPES.find(
                                        type =>
                                            type.value ===
                                            form.product_type
                                    )?.label}{" "}
                                    Specifications
                                </h2>

                                <p>
                                    These fields change automatically according to product type.
                                </p>

                            </div>

                        </div>


                        <div className="dynamic-spec-grid">

                            {specificationFields.map(
                                field => (

                                    <div
                                        className="form-field"
                                        key={field.key}
                                    >

                                        <label>
                                            {field.key}
                                        </label>

                                        <input
                                            value={
                                                getSpecificationValue(
                                                    field.key
                                                )
                                            }
                                            onChange={event =>
                                                updateSpecification(
                                                    field.key,
                                                    event.target.value
                                                )
                                            }
                                            placeholder={
                                                `Enter ${field.key.toLowerCase()}`
                                            }
                                        />

                                        <small>
                                            {field.group}
                                        </small>

                                    </div>

                                )
                            )}

                        </div>


                        <div className="specification-note">

                            <strong>
                                ✦ Smart specifications
                            </strong>

                            <p>
                                Aurora automatically changes the specification fields based on the selected product type.
                            </p>

                        </div>

                    </div>

                )}


                {/* =================================================
                    STEP 5
                ================================================= */}

                {step === 5 && (

                    <div className="product-form-section">

                        <div className="product-form-section-heading">

                            <div>

                                <span>
                                    05
                                </span>

                                <h2>
                                    Shipping & Returns
                                </h2>

                                <p>
                                    Configure delivery, COD and return settings.
                                </p>

                            </div>

                        </div>


                        <div className="form-grid-4">

                            {[
                                [
                                    "weight",
                                    "Weight",
                                    "kg",
                                    "0.000"
                                ],
                                [
                                    "length",
                                    "Length",
                                    "cm",
                                    "0"
                                ],
                                [
                                    "width",
                                    "Width",
                                    "cm",
                                    "0"
                                ],
                                [
                                    "height",
                                    "Height",
                                    "cm",
                                    "0"
                                ]
                            ].map(
                                item => (

                                    <div
                                        className="form-field"
                                        key={item[0]}
                                    >

                                        <label>
                                            {item[1]}
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                form[
                                                    item[0] as keyof FormData
                                                ] as string
                                            }
                                            onChange={event =>
                                                updateField(
                                                    item[0] as keyof FormData,
                                                    event.target.value
                                                )
                                            }
                                            placeholder={
                                                item[3]
                                            }
                                        />

                                        <small>
                                            {item[2]}
                                        </small>

                                    </div>

                                )
                            )}

                        </div>


                        <div className="form-toggle-list">

                            <label className="form-toggle">

                                <input
                                    type="checkbox"
                                    checked={
                                        form.free_shipping
                                    }
                                    onChange={event =>
                                        updateField(
                                            "free_shipping",
                                            event.target.checked
                                        )
                                    }
                                />

                                <span />

                                <div>

                                    <strong>
                                        Free Shipping
                                    </strong>

                                    <small>
                                        Customers don't pay delivery charges.
                                    </small>

                                </div>

                            </label>


                            <label className="form-toggle">

                                <input
                                    type="checkbox"
                                    checked={
                                        form.cod_available
                                    }
                                    onChange={event =>
                                        updateField(
                                            "cod_available",
                                            event.target.checked
                                        )
                                    }
                                />

                                <span />

                                <div>

                                    <strong>
                                        Cash on Delivery
                                    </strong>

                                    <small>
                                        Allow customers to pay on delivery.
                                    </small>

                                </div>

                            </label>


                            <label className="form-toggle">

                                <input
                                    type="checkbox"
                                    checked={
                                        form.return_available
                                    }
                                    onChange={event =>
                                        updateField(
                                            "return_available",
                                            event.target.checked
                                        )
                                    }
                                />

                                <span />

                                <div>

                                    <strong>
                                        Returns Available
                                    </strong>

                                    <small>
                                        Customers can return this product.
                                    </small>

                                </div>

                            </label>

                        </div>


                        {form.return_available && (

                            <div className="form-field return-days-field">

                                <label>
                                    Return Window
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    value={
                                        form.return_days
                                    }
                                    onChange={event =>
                                        updateField(
                                            "return_days",
                                            event.target.value
                                        )
                                    }
                                />

                                <small>
                                    Number of days after delivery.
                                </small>

                            </div>

                        )}

                    </div>

                )}


                {/* =================================================
                    STEP 6
                ================================================= */}

                {step === 6 && (

                    <div className="product-form-section">

                        <div className="product-form-section-heading">

                            <div>

                                <span>
                                    06
                                </span>

                                <h2>
                                    Search Engine Optimization
                                </h2>

                                <p>
                                    Help customers discover this product through search.
                                </p>

                            </div>

                        </div>


                        <div className="form-field">

                            <label>
                                SEO Title
                            </label>

                            <input
                                value={
                                    form.seo_title
                                }
                                maxLength={255}
                                onChange={event =>
                                    updateField(
                                        "seo_title",
                                        event.target.value
                                    )
                                }
                                placeholder="Premium Aurora product | Buy Online"
                            />

                            <div className="character-count">
                                {form.seo_title.length}/255
                            </div>

                        </div>


                        <div className="form-field">

                            <label>
                                Meta Description
                            </label>

                            <textarea
                                value={
                                    form.meta_description
                                }
                                maxLength={500}
                                onChange={event =>
                                    updateField(
                                        "meta_description",
                                        event.target.value
                                    )
                                }
                                rows={5}
                                placeholder="Write a short description that will appear in search results..."
                            />

                            <div className="character-count">
                                {form.meta_description.length}/500
                            </div>

                        </div>


                        <div className="form-field">

                            <label>
                                SEO Keywords
                            </label>

                            <input
                                value={
                                    form.seo_keywords
                                }
                                onChange={event =>
                                    updateField(
                                        "seo_keywords",
                                        event.target.value
                                    )
                                }
                                placeholder="premium, fashion, aurora, online shopping"
                            />

                        </div>


                        <div className="form-field">

                            <label>
                                Canonical URL
                            </label>

                            <input
                                value={
                                    form.canonical_url
                                }
                                onChange={event =>
                                    updateField(
                                        "canonical_url",
                                        event.target.value
                                    )
                                }
                                placeholder="https://example.com/products/product-name"
                            />

                        </div>

                    </div>

                )}


                {/* =================================================
                    STEP 7
                ================================================= */}

                {step === 7 && (

                    <div className="product-form-section">

                        <div className="product-form-section-heading">

                            <div>

                                <span>
                                    07
                                </span>

                                <h2>
                                    Review & Publish
                                </h2>

                                <p>
                                    Check everything before saving the product.
                                </p>

                            </div>

                        </div>


                        {/* =================================================
                            REVIEW PRODUCT PREVIEW
                        ================================================= */}

                        <div className="publish-preview">

                            <div className="publish-image">

                                {imageUrl.trim() ? (

                                    <img
                                        src={imageUrl.trim()}
                                        alt={
                                            form.name ||
                                            "Product"
                                        }
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block"
                                        }}
                                    />

                                ) : (

                                    <span>
                                        ✦
                                    </span>

                                )}

                            </div>


                            <div className="publish-details">

                                <span className="eyebrow">
                                    {form.product_type}
                                </span>

                                <h2>
                                    {form.name ||
                                        "Untitled Product"}
                                </h2>

                                <p>
                                    {form.brand ||
                                        "No brand"}
                                </p>


                                <div className="publish-price">

                                    <strong>
                                        ₹
                                        {Number(
                                            form.price || 0
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </strong>

                                    <del>
                                        ₹
                                        {Number(
                                            form.mrp || 0
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </del>

                                </div>

                            </div>

                        </div>


                        <div className="publish-summary">

                            <div>

                                <span>
                                    Stock
                                </span>

                                <strong>
                                    {form.stock}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    SKU
                                </span>

                                <strong>
                                    {form.sku || "—"}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Specifications
                                </span>

                                <strong>
                                    {
                                        specifications.filter(
                                            item =>
                                                item.specification_value.trim()
                                        ).length
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {form.status}
                                </strong>

                            </div>

                        </div>


                        <div className="publish-warning">

                            <strong>
                                ✦ Ready to{" "}
                                {mode === "edit"
                                    ? "save changes"
                                    : "create"}?
                            </strong>

                            <p>
                                {mode === "edit"
                                    ? "Your changes will be saved to the Aurora catalog."
                                    : "Click the button below to create this product."}
                            </p>

                        </div>

                    </div>

                )}

            </section>


            {/* =================================================
                NAVIGATION
            ================================================= */}

            <div className="product-form-navigation">

                {step > 1 ? (

                    <button
                        type="button"
                        className="form-back-btn"
                        onClick={
                            previousStep
                        }
                        disabled={saving}
                    >
                        ← Previous
                    </button>

                ) : (

                    <Link
                        href="/admin/products"
                        className="form-back-btn"
                    >
                        Cancel
                    </Link>

                )}


                <div>

                    {step < 7 ? (

                        <button
                            type="button"
                            className="form-next-btn"
                            onClick={
                                nextStep
                            }
                            disabled={saving}
                        >
                            Continue

                            <span>
                                →
                            </span>

                        </button>

                    ) : (

                        <button
                            type="button"
                            className="form-publish-btn"
                            disabled={saving}
                            onClick={
                                saveProduct
                            }
                        >

                            {saving
                                ? (
                                    mode === "edit"
                                        ? "Saving..."
                                        : "Creating..."
                                )
                                : (
                                    mode === "edit"
                                        ? "Save Changes"
                                        : "Create Product"
                                )}

                            {!saving && (

                                <span>
                                    ✦
                                </span>

                            )}

                        </button>

                    )}

                </div>

            </div>

        </div>

    );

}