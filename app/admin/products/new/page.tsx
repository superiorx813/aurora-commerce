"use client";

import { useMemo, useState } from "react";
import Link from "next/link";


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

    category_id: string;

    sku: string;

    price: string;
    mrp: string;

    stock: string;

    featured: boolean;

    status: "DRAFT" | "ACTIVE";


    // Shipping

    weight: string;
    length: string;
    width: string;
    height: string;

    free_shipping: boolean;
    cod_available: boolean;

    return_available: boolean;
    return_days: string;


    // SEO

    seo_title: string;
    meta_description: string;
    seo_keywords: string;
    canonical_url: string;
};


// =========================================================
// PRODUCT TYPE CONFIGURATION
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
// SPECIFICATION CONFIGURATION
// =========================================================

const SPECIFICATION_FIELDS: Record<
    ProductType,
    {
        group: string;
        key: string;
    }[]
> = {

    fashion: [

        {
            group: "General",
            key: "Gender"
        },

        {
            group: "General",
            key: "Fabric"
        },

        {
            group: "General",
            key: "Color"
        },

        {
            group: "General",
            key: "Size"
        },

        {
            group: "General",
            key: "Fit"
        },

        {
            group: "General",
            key: "Pattern"
        },

        {
            group: "General",
            key: "Occasion"
        },

        {
            group: "Care",
            key: "Wash Care"
        }
    ],


    electronics: [

        {
            group: "General",
            key: "Model Number"
        },

        {
            group: "General",
            key: "Color"
        },

        {
            group: "Performance",
            key: "Processor"
        },

        {
            group: "Performance",
            key: "RAM"
        },

        {
            group: "Performance",
            key: "Storage"
        },

        {
            group: "Display",
            key: "Screen Size"
        },

        {
            group: "Battery",
            key: "Battery Capacity"
        },

        {
            group: "Connectivity",
            key: "Connectivity"
        },

        {
            group: "Warranty",
            key: "Warranty"
        }
    ],


    shoes: [

        {
            group: "General",
            key: "Gender"
        },

        {
            group: "General",
            key: "Shoe Type"
        },

        {
            group: "General",
            key: "Color"
        },

        {
            group: "General",
            key: "Size"
        },

        {
            group: "Material",
            key: "Upper Material"
        },

        {
            group: "Material",
            key: "Sole Material"
        },

        {
            group: "Design",
            key: "Closure"
        },

        {
            group: "Design",
            key: "Occasion"
        }
    ],


    beauty: [

        {
            group: "General",
            key: "Skin Type"
        },

        {
            group: "General",
            key: "Concern"
        },

        {
            group: "General",
            key: "Form"
        },

        {
            group: "General",
            key: "Net Quantity"
        },

        {
            group: "Ingredients",
            key: "Ingredients"
        },

        {
            group: "General",
            key: "Fragrance"
        },

        {
            group: "Origin",
            key: "Country of Origin"
        }
    ],


    grocery: [

        {
            group: "General",
            key: "Net Weight"
        },

        {
            group: "General",
            key: "Pack Size"
        },

        {
            group: "General",
            key: "Pack Type"
        },

        {
            group: "Ingredients",
            key: "Ingredients"
        },

        {
            group: "General",
            key: "Vegetarian"
        },

        {
            group: "Origin",
            key: "Country of Origin"
        }
    ],


    home: [

        {
            group: "General",
            key: "Material"
        },

        {
            group: "General",
            key: "Color"
        },

        {
            group: "General",
            key: "Dimensions"
        },

        {
            group: "General",
            key: "Room Type"
        },

        {
            group: "General",
            key: "Assembly Required"
        },

        {
            group: "Warranty",
            key: "Warranty"
        }
    ],


    other: [

        {
            group: "General",
            key: "Color"
        },

        {
            group: "General",
            key: "Material"
        },

        {
            group: "General",
            key: "Country of Origin"
        }
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

    category_id: "",

    sku: "",

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
// COMPONENT
// =========================================================

export default function NewProductPage() {


    // =====================================================
    // STATE
    // =====================================================

    const [form, setForm] =
        useState<FormData>(INITIAL_FORM);


    const [step, setStep] =
        useState(1);


    const [saving, setSaving] =
        useState(false);


    const [error, setError] =
        useState("");


    const [success, setSuccess] =
        useState("");


    const [imageUrl, setImageUrl] =
        useState("");


    const [galleryUrls, setGalleryUrls] =
        useState<string[]>([]);


    const [specifications, setSpecifications] =
        useState<Specification[]>([]);


    // =====================================================
    // UPDATE FORM
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
    // CHANGE PRODUCT TYPE
    // =====================================================

    function changeProductType(
        type: ProductType
    ) {

        updateField(
            "product_type",
            type
        );


        // Clear old specifications

        setSpecifications([]);
    }


    // =====================================================
    // SPECIFICATION FIELDS
    // =====================================================

    const specificationFields =
        useMemo(
            () =>
                SPECIFICATION_FIELDS[
                    form.product_type
                ],
            [form.product_type]
        );


    // =====================================================
    // UPDATE SPECIFICATION
    // =====================================================

    function updateSpecification(
        key: string,
        value: string
    ) {

        setSpecifications(previous => {

            const existing =
                previous.find(
                    item =>
                        item.specification_key === key
                );


            if (existing) {

                return previous.map(item =>

                    item.specification_key === key

                        ? {
                            ...item,
                            specification_value: value
                        }

                        : item
                );
            }


            const field =
                specificationFields.find(
                    item =>
                        item.key === key
                );


            return [

                ...previous,

                {

                    specification_group:
                        field?.group || "General",

                    specification_key:
                        key,

                    specification_value:
                        value

                }

            ];
        });
    }


    // =====================================================
    // GET SPECIFICATION VALUE
    // =====================================================

    function getSpecificationValue(
        key: string
    ) {

        return (
            specifications.find(
                item =>
                    item.specification_key === key
            )?.specification_value || ""
        );
    }


    // =====================================================
    // ADD GALLERY IMAGE
    // =====================================================

    function addGalleryImage() {

        if (!imageUrl.trim()) {
            return;
        }


        setGalleryUrls(previous => [

            ...previous,

            imageUrl.trim()

        ]);


        setImageUrl("");
    }


    // =====================================================
    // REMOVE GALLERY IMAGE
    // =====================================================

    function removeGalleryImage(
        index: number
    ) {

        setGalleryUrls(previous =>

            previous.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )

        );
    }


    // =====================================================
    // VALIDATE
    // =====================================================

    function validateStep(): boolean {

        setError("");


        // -----------------------------------------------
        // BASIC
        // -----------------------------------------------

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
                    "Category ID is required for now."
                );

                return false;
            }
        }


        // -----------------------------------------------
        // PRICING
        // -----------------------------------------------

        if (step === 2) {

            const price =
                Number(form.price);

            const mrp =
                Number(form.mrp);

            const stock =
                Number(form.stock);


            if (!form.sku.trim()) {

                setError(
                    "SKU is required."
                );

                return false;
            }


            if (!price || price <= 0) {

                setError(
                    "Enter a valid selling price."
                );

                return false;
            }


            if (!mrp || mrp <= 0) {

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
                Number.isNaN(stock) ||
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
    // NEXT
    // =====================================================

    function nextStep() {

        if (!validateStep()) {
            return;
        }


        setStep(
            Math.min(
                step + 1,
                7
            )
        );
    }


    // =====================================================
    // PREVIOUS
    // =====================================================

    function previousStep() {

        setError("");

        setStep(
            Math.max(
                step - 1,
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


        if (!validateStep()) {
            return;
        }


        try {

            setSaving(true);


            const response =
                await fetch(
                    "/api/admin/products",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            form,

                            image_url:
                                imageUrl,

                            gallery_urls:
                                galleryUrls,

                            specifications

                        })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to create product."
                );
            }


            setSuccess(
                "Product created successfully."
            );


            // Reset

            setForm(INITIAL_FORM);

            setGalleryUrls([]);

            setSpecifications([]);

            setImageUrl("");

            setStep(1);


        } catch (err: any) {

            console.error(
                "CREATE PRODUCT ERROR:",
                err
            );


            setError(
                err.message ||
                "Unable to create product."
            );

        } finally {

            setSaving(false);
        }
    }


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <main className="container page-shell">


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
                        Add Product
                    </h1>


                    <p>
                        Create a new product for
                        your Aurora storefront.
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
                ERROR / SUCCESS
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
                    STEP 1 — BASIC
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
                                    Tell Aurora what
                                    you're selling.
                                </p>

                            </div>

                        </div>


                        {/* PRODUCT TYPE */}

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
                                    onChange={event =>
                                        updateField(
                                            "name",
                                            event.target.value
                                        )
                                    }
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
                                    value={
                                        form.category_id
                                    }
                                    onChange={event =>
                                        updateField(
                                            "category_id",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Example: 4"
                                />

                                <small className="field-help">
                                    We will replace this
                                    with a category dropdown
                                    in the next step.
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


                        <div className="form-field">

                            <label>
                                Product Description
                            </label>

                            <textarea
                                value={
                                    form.description
                                }
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
                    STEP 2 — PRICING
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
                                    Configure pricing,
                                    stock and availability.
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
                                        value={
                                            form.price
                                        }
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
                                        value={
                                            form.mrp
                                        }
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
                                    value={
                                        form.stock
                                    }
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

                                    {Number(
                                        form.mrp
                                    ) > 0

                                        ? Math.round(
                                            (
                                                1 -
                                                Number(
                                                    form.price
                                                ) /
                                                Number(
                                                    form.mrp
                                                )
                                            ) * 100
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
                                        Show this product
                                        in featured sections.
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
                                        Make this product
                                        visible on the storefront.
                                    </small>

                                </div>

                            </label>

                        </div>

                    </div>

                )}


                {/* =================================================
                    STEP 3 — MEDIA
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
                                    Add the product's
                                    main image and gallery.
                                </p>

                            </div>

                        </div>


                        <div className="media-main-field">

                            <label>
                                Primary Image URL
                            </label>

                            <input
                                value={imageUrl}
                                onChange={event =>
                                    setImageUrl(
                                        event.target.value
                                    )
                                }
                                placeholder="https://example.com/product-image.jpg"
                            />

                            <small>
                                For now we're using image
                                URLs. File/image upload
                                storage will be added next.
                            </small>

                        </div>


                        {imageUrl && (

                            <div className="primary-image-preview">

                                <img
                                    src={imageUrl}
                                    alt="Product preview"
                                />

                            </div>

                        )}


                        <div className="gallery-field">

                            <label>
                                Gallery Images
                            </label>

                            <div className="gallery-add-row">

                                <input
                                    value={imageUrl}
                                    onChange={event =>
                                        setImageUrl(
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
                                                alt={`Gallery ${index + 1}`}
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
                    STEP 4 — SPECIFICATIONS
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
                                    )?.label}
                                    {" "}
                                    Specifications
                                </h2>

                                <p>
                                    These fields change
                                    automatically according
                                    to product type.
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
                                Aurora automatically
                                changes the specification
                                fields based on the selected
                                product type.
                            </p>

                        </div>

                    </div>

                )}


                {/* =================================================
                    STEP 5 — SHIPPING
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
                                    Configure delivery,
                                    COD and return settings.
                                </p>

                            </div>

                        </div>


                        <div className="form-grid-4">

                            <div className="form-field">

                                <label>
                                    Weight
                                </label>

                                <input
                                    type="number"
                                    value={
                                        form.weight
                                    }
                                    onChange={event =>
                                        updateField(
                                            "weight",
                                            event.target.value
                                        )
                                    }
                                    placeholder="0.000"
                                />

                                <small>
                                    kg
                                </small>

                            </div>


                            <div className="form-field">

                                <label>
                                    Length
                                </label>

                                <input
                                    type="number"
                                    value={
                                        form.length
                                    }
                                    onChange={event =>
                                        updateField(
                                            "length",
                                            event.target.value
                                        )
                                    }
                                    placeholder="0"
                                />

                                <small>
                                    cm
                                </small>

                            </div>


                            <div className="form-field">

                                <label>
                                    Width
                                </label>

                                <input
                                    type="number"
                                    value={
                                        form.width
                                    }
                                    onChange={event =>
                                        updateField(
                                            "width",
                                            event.target.value
                                        )
                                    }
                                    placeholder="0"
                                />

                                <small>
                                    cm
                                </small>

                            </div>


                            <div className="form-field">

                                <label>
                                    Height
                                </label>

                                <input
                                    type="number"
                                    value={
                                        form.height
                                    }
                                    onChange={event =>
                                        updateField(
                                            "height",
                                            event.target.value
                                        )
                                    }
                                    placeholder="0"
                                />

                                <small>
                                    cm
                                </small>

                            </div>

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
                                        Customers don't
                                        pay delivery charges.
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
                                        Allow customers
                                        to pay on delivery.
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
                                        Customers can
                                        return this product.
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
                                    Number of days after
                                    delivery.
                                </small>

                            </div>

                        )}

                    </div>

                )}


                {/* =================================================
                    STEP 6 — SEO
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
                                    Help customers discover
                                    this product through search.
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
                                onChange={event =>
                                    updateField(
                                        "seo_title",
                                        event.target.value
                                    )
                                }
                                placeholder="Premium Aurora product | Buy Online"
                            />

                            <div className="character-count">

                                {form.seo_title.length}
                                /255

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

                                {form.meta_description.length}
                                /500

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
                    STEP 7 — PUBLISH
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
                                    Check everything before
                                    creating the product.
                                </p>

                            </div>

                        </div>


                        <div className="publish-preview">

                            <div className="publish-image">

                                {imageUrl ? (

                                    <img
                                        src={imageUrl}
                                        alt={form.name}
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
                                    {form.sku ||
                                        "—"}
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
                                                item.specification_value
                                                    .trim()
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
                                ✦ Ready to create?
                            </strong>

                            <p>
                                Clicking the button below
                                will save the product and
                                all related information
                                to Aurora.
                            </p>

                        </div>

                    </div>

                )}

            </section>


            {/* =================================================
                FORM NAVIGATION
            ================================================= */}

            <div className="product-form-navigation">

                {step > 1 ? (

                    <button
                        type="button"
                        className="form-back-btn"
                        onClick={
                            previousStep
                        }
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
                                ? "Creating..."
                                : "Create Product"}

                            {!saving && (
                                <span>
                                    ✦
                                </span>
                            )}

                        </button>

                    )}

                </div>

            </div>

        </main>
    );
}