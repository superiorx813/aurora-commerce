
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
  Package,
  IndianRupee,
  Layers3,
  Save,
  Settings2,
  ShieldCheck,
  Truck,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

type Product = {
  id?: number | string;
  name?: string;
  slug?: string;
  brand?: string;
  description?: string;
  short_description?: string;
  category_id?: number | string;
  sku?: string;
  price?: number | string;
  mrp?: number | string;
  stock?: number | string;
  featured?: boolean | number;
  status?: string;
  product_type?: string;
  image_url?: string;
  gallery_json?: string;
  gallery_urls?: string[];
  weight?: number | string;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  free_shipping?: boolean | number;
  cod_available?: boolean | number;
  return_available?: boolean | number;
  return_days?: number | string;
  seo_title?: string;
  meta_description?: string;
  seo_keywords?: string;
  canonical_url?: string;
  specifications?: Specification[];
  shipping?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  [key: string]: unknown;
};

type Specification = {
  name: string;
  value: string;
};

type FormData = {
  product_type: string;
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
  status: string;
  image_url: string;
  gallery_urls: string[];
  specifications: Specification[];
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
  product?: Product;
};

const PRODUCT_TYPES = [
  {
    value: "fashion",
    label: "Fashion",
    description: "Clothing and accessories",
    icon: "👕",
  },
  {
    value: "electronics",
    label: "Electronics",
    description: "Gadgets and devices",
    icon: "🎧",
  },
  {
    value: "shoes",
    label: "Footwear",
    description: "Shoes and sandals",
    icon: "👟",
  },
  {
    value: "beauty",
    label: "Beauty",
    description: "Beauty and personal care",
    icon: "✨",
  },
  {
    value: "grocery",
    label: "Grocery",
    description: "Daily essentials",
    icon: "🥑",
  },
  {
    value: "home",
    label: "Home",
    description: "Home and living",
    icon: "🏡",
  },
  {
    value: "other",
    label: "Other",
    description: "Other products",
    icon: "📦",
  },
];

const SPECIFICATION_FIELDS = [
  "Material",
  "Color",
  "Size",
  "Weight",
  "Dimensions",
  "Warranty",
  "Model",
  "Country of origin",
];

const STEPS = [
  {
    title: "Basic details",
    description: "Product identity",
    icon: Package,
  },
  {
    title: "Pricing",
    description: "Price and inventory",
    icon: IndianRupee,
  },
  {
    title: "Media",
    description: "Product images",
    icon: ImageIcon,
  },
  {
    title: "Specifications",
    description: "Product features",
    icon: Settings2,
  },
  {
    title: "Shipping",
    description: "Delivery options",
    icon: Truck,
  },
  {
    title: "SEO",
    description: "Search visibility",
    icon: Search,
  },
  {
    title: "Review & publish",
    description: "Final verification",
    icon: ShieldCheck,
  },
];

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
  status: "ACTIVE",
  image_url: "",
  gallery_urls: [],
  specifications: [],
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
  canonical_url: "",
};

function toBoolean(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return value === true || value === 1 || value === "1";
}

function buildInitialForm(product?: Product): FormData {
  if (!product) {
    return { ...INITIAL_FORM };
  }

  let gallery: string[] = [];

  if (Array.isArray(product.gallery_urls)) {
    gallery = product.gallery_urls;
  } else if (typeof product.gallery_json === "string") {
    try {
      const parsed: unknown = JSON.parse(product.gallery_json);
      if (Array.isArray(parsed)) {
        gallery = parsed.filter(
          (item): item is string => typeof item === "string"
        );
      }
    } catch {
      gallery = [];
    }
  }

  const shipping = product.shipping ?? {};
  const seo = product.seo ?? {};

  return {
    ...INITIAL_FORM,
    product_type: String(product.product_type ?? "fashion"),
    name: String(product.name ?? ""),
    brand: String(product.brand ?? ""),
    description: String(product.description ?? ""),
    short_description: String(product.short_description ?? ""),
    category_id: String(product.category_id ?? ""),
    sku: String(product.sku ?? ""),
    slug: String(product.slug ?? ""),
    price: String(product.price ?? ""),
    mrp: String(product.mrp ?? ""),
    stock: String(product.stock ?? "0"),
    featured: toBoolean(product.featured),
    status: String(product.status ?? "ACTIVE"),
    image_url: String(product.image_url ?? ""),
    gallery_urls: gallery,
    specifications: Array.isArray(product.specifications)
      ? product.specifications.map((item) => ({
          name: String(item.name ?? ""),
          value: String(item.value ?? ""),
        }))
      : [],
    weight: String(product.weight ?? shipping.weight ?? ""),
    length: String(product.length ?? shipping.length ?? ""),
    width: String(product.width ?? shipping.width ?? ""),
    height: String(product.height ?? shipping.height ?? ""),
    free_shipping: toBoolean(
      product.free_shipping ?? shipping.free_shipping
    ),
    cod_available: toBoolean(
      product.cod_available ?? shipping.cod_available,
      true
    ),
    return_available: toBoolean(
      product.return_available ?? shipping.return_available,
      true
    ),
    return_days: String(
      product.return_days ?? shipping.return_days ?? "7"
    ),
    seo_title: String(product.seo_title ?? seo.title ?? ""),
    meta_description: String(
      product.meta_description ?? seo.meta_description ?? ""
    ),
    seo_keywords: String(
      product.seo_keywords ?? seo.keywords ?? ""
    ),
    canonical_url: String(
      product.canonical_url ?? seo.canonical_url ?? ""
    ),
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  min,
  step,
  help,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  min?: number;
  step?: number;
  help?: string;
  disabled?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold text-secondary small">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>
      <input
        type={type}
        className="form-control bg-body"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        required={required}
        min={min}
        step={step}
        disabled={disabled}
      />
      {help && <div className="form-text">{help}</div>}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  help?: string;
}) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold text-secondary small">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>
      <textarea
        className="form-control bg-body"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        required={required}
      />
      {help && <div className="form-text">{help}</div>}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <div className="small fw-bold text-primary text-uppercase mb-2">
        {eyebrow}
      </div>
      <h4 className="fw-bold text-body mb-2">{title}</h4>
      <p className="text-secondary mb-0">{description}</p>
    </div>
  );
}

function formatPrice(value: string | number): string {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

export default function ProductForm({
  mode,
  product,
}: ProductFormProps) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(() =>
    buildInitialForm(product)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [galleryInput, setGalleryInput] = useState("");

  useEffect(() => {
    setForm(buildInitialForm(product));
  }, [product]);

  const isEdit = mode === "edit";

  const discount = useMemo(() => {
    const price = Number(form.price);
    const mrp = Number(form.mrp);

    if (!mrp || mrp <= 0 || price < 0 || price >= mrp) {
      return 0;
    }

    return Math.round(((mrp - price) / mrp) * 100);
  }, [form.price, form.mrp]);

  const savings = useMemo(() => {
    return Math.max(0, Number(form.mrp || 0) - Number(form.price || 0));
  }, [form.price, form.mrp]);

  function updateField<K extends keyof FormData>(
    key: K,
    value: FormData[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
    setSuccess("");
  }

  function validateStep(targetStep = step): boolean {
    if (targetStep === 0) {
      if (!form.name.trim()) {
        setError("Please enter the product name.");
        return false;
      }

      if (!form.category_id.trim()) {
        setError("Please enter the product category ID.");
        return false;
      }
    }

    if (targetStep === 1) {
      if (form.price === "" || Number(form.price) < 0) {
        setError("Enter a valid selling price.");
        return false;
      }

      if (form.mrp !== "" && Number(form.mrp) < Number(form.price)) {
        setError("MRP should be greater than or equal to the selling price.");
        return false;
      }

      if (form.stock === "" || Number(form.stock) < 0) {
        setError("Enter a valid stock quantity.");
        return false;
      }
    }

    setError("");
    return true;
  }

  function goNext() {
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  function addGalleryImages() {
    const urls = galleryInput
      .split(/\n|,/)
      .map((url) => url.trim())
      .filter(Boolean);

    if (!urls.length) return;

    updateField(
      "gallery_urls",
      Array.from(new Set([...form.gallery_urls, ...urls]))
    );
    setGalleryInput("");
  }

  function addSpecification(name = "", value = "") {
    updateField("specifications", [
      ...form.specifications,
      { name, value },
    ]);
  }

  function updateSpecification(
    index: number,
    key: keyof Specification,
    value: string
  ) {
    updateField(
      "specifications",
      form.specifications.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  }

  function removeSpecification(index: number) {
    updateField(
      "specifications",
      form.specifications.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function saveProduct() {
    if (!validateStep(0) || !validateStep(1)) {
      setStep(!form.name.trim() || !form.category_id.trim() ? 0 : 1);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      category_id: Number(form.category_id),
      price: Number(form.price),
      mrp: form.mrp === "" ? Number(form.price) : Number(form.mrp),
      stock: Number(form.stock),
      image_url: form.image_url.trim(),
      gallery_json: JSON.stringify(form.gallery_urls),
      gallery_urls: form.gallery_urls,
      specifications: form.specifications.filter(
        (item) => item.name.trim() && item.value.trim()
      ),
      shipping: {
        weight: form.weight === "" ? null : Number(form.weight),
        length: form.length === "" ? null : Number(form.length),
        width: form.width === "" ? null : Number(form.width),
        height: form.height === "" ? null : Number(form.height),
        free_shipping: form.free_shipping,
        cod_available: form.cod_available,
        return_available: form.return_available,
        return_days: Number(form.return_days || 0),
      },
      seo: {
        title: form.seo_title,
        meta_description: form.meta_description,
        keywords: form.seo_keywords,
        canonical_url: form.canonical_url,
      },
    };

    try {
      const endpoint = isEdit
        ? `/api/admin/products/${product?.id}`
        : "/api/admin/products";

      const response = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Unable to save the product. Please check your details."
        );
      }

      setSuccess(
        isEdit
          ? "Product updated successfully."
          : "Product created successfully."
      );

      router.refresh();

      if (!isEdit) {
        setForm({ ...INITIAL_FORM });
        setStep(0);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong while saving the product."
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedType =
    PRODUCT_TYPES.find((item) => item.value === form.product_type) ??
    PRODUCT_TYPES[0];

  return (
    <main className="min-vh-100 bg-body-tertiary py-4 py-lg-5">
      <div className="container-fluid px-3 px-lg-4" style={{ maxWidth: 1440 }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div className="d-flex align-items-center gap-3">
            <Link
              href="/admin/products"
              className="btn btn-outline-primary bg-gradient rounded-3"
              aria-label="Back to products"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="small text-primary fw-bold text-uppercase mb-1">
                Aurora Control
              </div>
              <h2 className="fw-bold mb-1">
                {isEdit ? "Edit product" : "Create a product"}
              </h2>
              <p className="text-secondary mb-0">
                Manage product details, pricing, media and delivery.
              </p>
            </div>
          </div>

          <span className="badge rounded-pill text-bg-primary bg-gradient px-3 py-2">
            <Sparkles size={14} className="me-1" />
            Product studio
          </span>
        </div>

        <div className="card border border-primary-subtle rounded-4 shadow-sm overflow-hidden mb-4">
          <div className="card-header bg-primary bg-gradient text-white border-0 p-3 p-lg-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <div className="small text-white-50 fw-semibold mb-1">
                  PRODUCT WORKFLOW
                </div>
                <h5 className="fw-bold mb-1">
                  {isEdit ? "Update your product" : "Set up your product"}
                </h5>
                <p className="small text-white-50 mb-0">
                  Complete each section to prepare your product for publishing.
                </p>
              </div>
              <div className="text-end">
                <div className="fs-4 fw-bold">
                  {step + 1}
                  <span className="fs-6 text-white-50">
                    {" "}
                    / {STEPS.length}
                  </span>
                </div>
                <div className="small text-white-50">Steps completed in order</div>
              </div>
            </div>

            <div
              className="progress mt-4 bg-black bg-opacity-10"
              role="progressbar"
              aria-label="Product setup progress"
              aria-valuenow={Math.round(((step + 1) / STEPS.length) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ height: 6 }}
            >
              <div
                className="progress-bar bg-white"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="card-body bg-body-tertiary p-3 p-lg-4">
            <div className="row row-cols-2 row-cols-md-4 row-cols-xl-7 g-2">
              {STEPS.map((item, index) => {
                const Icon = item.icon;
                const active = step === index;
                const completed = step > index;

                return (
                  <div className="col" key={item.title}>
                    <button
                      type="button"
                      onClick={() => {
                        if (index <= step) {
                          setError("");
                          setStep(index);
                        } else if (validateStep()) {
                          setStep(index);
                        }
                      }}
                      className={`btn w-100 h-100 rounded-3 text-start p-2 p-lg-3 bg-gradient ${
                        active
                          ? "btn-primary shadow-sm"
                          : completed
                            ? "btn-outline-primary"
                            : "btn-outline-secondary bg-body"
                      }`}
                    >
                      <div className="d-flex align-items-center justify-content-between gap-1 mb-2">
                        <span
                          className={`rounded-2 d-inline-flex align-items-center justify-content-center ${
                            active
                              ? "bg-white bg-opacity-25 text-white"
                              : "bg-primary-subtle text-primary"
                          }`}
                          style={{ width: 32, height: 32 }}
                        >
                          {completed ? (
                            <Check size={16} />
                          ) : (
                            <Icon size={16} />
                          )}
                        </span>
                        <span className="small fw-bold">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="small fw-bold">{item.title}</div>
                      <div
                        className={`d-none d-lg-block small mt-1 ${
                          active ? "text-white-50" : "text-secondary"
                        }`}
                      >
                        {item.description}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <div
            className="alert alert-danger d-flex align-items-start gap-2 rounded-3"
            role="alert"
          >
            <X size={18} className="flex-shrink-0 mt-1" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div
            className="alert alert-success d-flex align-items-start gap-2 rounded-3"
            role="status"
          >
            <CheckCircle2 size={18} className="flex-shrink-0 mt-1" />
            <div>{success}</div>
          </div>
        )}

        <div className="row g-4 align-items-start">
          <div className="col-xl-8">
            <section className="card border border-primary-subtle bg-body-tertiary rounded-4 shadow-sm overflow-hidden">
              <div className="card-header bg-body-tertiary border-bottom border-primary-subtle p-3 p-lg-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 44, height: 44 }}>
                    {(() => {
                      const Icon = STEPS[step].icon;
                      return <Icon size={21} />;
                    })()}
                  </div>
                  <div>
                    <div className="small text-primary fw-bold">
                      STEP {String(step + 1).padStart(2, "0")}
                    </div>
                    <h4 className="fw-bold mb-0">{STEPS[step].title}</h4>
                  </div>
                </div>
              </div>

              <div className="card-body p-3 p-md-4 p-lg-5">
                {step === 0 && (
                  <>
                    <SectionHeading
                      eyebrow="Getting started"
                      title="Choose your product type"
                      description="Select the type that best describes your product."
                    />

                    <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-2 mb-4">
                      {PRODUCT_TYPES.map((type) => {
                        const active = form.product_type === type.value;

                        return (
                          <div className="col" key={type.value}>
                            <button
                              type="button"
                              onClick={() =>
                                updateField("product_type", type.value)
                              }
                              className={`btn w-100 h-100 text-start rounded-3 border p-2 bg-gradient ${
                                active
                                  ? "btn-primary shadow-sm"
                                  : "btn-outline-primary bg-body"
                              }`}
                            >
                              <div className="d-flex align-items-center justify-content-between gap-1">
                                <span className="fs-4">{type.icon}</span>
                                {active && <CheckCircle2 size={16} />}
                              </div>
                              <div className="fw-bold small mt-2">
                                {type.label}
                              </div>
                              <div
                                className={`small mt-1 ${
                                  active ? "text-white-50" : "text-secondary"
                                }`}
                              >
                                {type.description}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <SectionHeading
                      eyebrow="Product identity"
                      title="Basic information"
                      description="Enter the main details customers will see."
                    />

                    <div className="row g-3">
                      <div className="col-md-8">
                        <Field
                          label="Product name"
                          value={form.name}
                          onChange={(value) => {
                            updateField("name", value);
                            if (!form.slug) {
                              updateField(
                                "slug",
                                value
                                  .toLowerCase()
                                  .trim()
                                  .replace(/[^a-z0-9]+/g, "-")
                                  .replace(/^-|-$/g, "")
                              );
                            }
                          }}
                          placeholder="e.g. Premium Everyday Backpack"
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <Field
                          label="Brand"
                          value={form.brand}
                          onChange={(value) => updateField("brand", value)}
                          placeholder="Brand name"
                        />
                      </div>
                      <div className="col-md-6">
                        <Field
                          label="Category ID"
                          value={form.category_id}
                          onChange={(value) =>
                            updateField("category_id", value)
                          }
                          placeholder="Enter category ID"
                          type="number"
                          min={1}
                          required
                          help="Enter the existing ID from your product categories table."
                        />
                      </div>
                      <div className="col-md-6">
                        <Field
                          label="SKU"
                          value={form.sku}
                          onChange={(value) => updateField("sku", value)}
                          placeholder="e.g. AUR-BAG-001"
                        />
                      </div>
                      <div className="col-12">
                        <Field
                          label="URL slug"
                          value={form.slug}
                          onChange={(value) => updateField("slug", value)}
                          placeholder="premium-everyday-backpack"
                          help="Used in the product URL."
                        />
                      </div>
                      <div className="col-12">
                        <TextAreaField
                          label="Short description"
                          value={form.short_description}
                          onChange={(value) =>
                            updateField("short_description", value)
                          }
                          placeholder="A short summary of your product"
                          rows={2}
                        />
                      </div>
                      <div className="col-12">
                        <TextAreaField
                          label="Full description"
                          value={form.description}
                          onChange={(value) =>
                            updateField("description", value)
                          }
                          placeholder="Describe the product, its features and benefits..."
                          rows={5}
                        />
                      </div>
                    </div>

                    <div className="rounded-3 border border-primary-subtle bg-body p-3 mt-2">
                      <div className="form-check form-switch">
                        <input
                          id="featured-product"
                          className="form-check-input"
                          type="checkbox"
                          checked={form.featured}
                          onChange={(event) =>
                            updateField("featured", event.target.checked)
                          }
                        />
                        <label
                          htmlFor="featured-product"
                          className="form-check-label fw-semibold"
                        >
                          Feature this product
                        </label>
                      </div>
                      <div className="form-text">
                        Enable this if the product should be highlighted in featured product areas.
                      </div>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <SectionHeading
                      eyebrow="Commercial details"
                      title="Pricing and inventory"
                      description="Set a clear selling price and keep stock information accurate."
                    />

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary small">
                          Selling price <span className="text-danger">*</span>
                        </label>
                        <div className="input-group input-group-lg">
                          <span className="input-group-text bg-primary-subtle text-primary-emphasis fw-bold">
                            ₹
                          </span>
                          <input
                            className="form-control fw-semibold bg-body"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={(event) =>
                              updateField("price", event.target.value)
                            }
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div className="form-text">
                          The price customers pay.
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary small">
                          MRP
                        </label>
                        <div className="input-group input-group-lg">
                          <span className="input-group-text bg-body-secondary fw-bold text-secondary">
                            ₹
                          </span>
                          <input
                            className="form-control fw-semibold bg-body"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.mrp}
                            onChange={(event) =>
                              updateField("mrp", event.target.value)
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="form-text">
                          Maximum retail price before discount.
                        </div>
                      </div>

                      <div className="col-md-6">
                        <Field
                          label="Available stock"
                          value={form.stock}
                          onChange={(value) => updateField("stock", value)}
                          placeholder="0"
                          type="number"
                          min={0}
                          step={1}
                          required
                          help="Number of units currently available."
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary small">
                          Product status
                        </label>
                        <select
                          className="form-select bg-body"
                          value={form.status}
                          onChange={(event) =>
                            updateField("status", event.target.value)
                          }
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="DRAFT">Draft</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-md-4">
                        <div className="card border border-primary-subtle bg-body rounded-4 h-100">
                          <div className="card-body p-3 p-lg-4">
                            <div className="small text-secondary mb-2">
                              Selling price
                            </div>
                            <div className="display-6 fw-bold text-primary-emphasis text-break">
                              <span className="fs-4">₹</span>
                              {formatPrice(form.price)}
                            </div>
                            <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis mt-2">
                              Current price
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="card border bg-body rounded-4 h-100">
                          <div className="card-body p-3 p-lg-4">
                            <div className="small text-secondary mb-2">
                              Maximum retail price
                            </div>
                            <div className="h3 fw-bold text-secondary text-break">
                              ₹{formatPrice(form.mrp || form.price)}
                            </div>
                            <span className="badge rounded-pill text-bg-secondary mt-2">
                              MRP
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="card border border-success-subtle bg-success-subtle rounded-4 h-100">
                          <div className="card-body p-3 p-lg-4">
                            <div className="small text-success-emphasis mb-2">
                              Customer savings
                            </div>
                            <div className="display-6 fw-bold text-success-emphasis">
                              {discount}
                              <span className="fs-4">%</span>
                            </div>
                            <div className="small text-success-emphasis mt-1">
                              ₹{formatPrice(savings)} off
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3 border border-primary-subtle bg-body p-3 mt-4">
                      <div className="d-flex align-items-start gap-3">
                        <div className="rounded-3 bg-primary-subtle text-primary p-2">
                          <Tag size={20} />
                        </div>
                        <div>
                          <div className="fw-bold">Pricing preview</div>
                          <div className="small text-secondary">
                            The discount and savings update automatically when you change the price or MRP.
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <SectionHeading
                      eyebrow="Visual presentation"
                      title="Product media"
                      description="Add the main product image and optional gallery image URLs."
                    />

                    <div className="mb-4">
                      <label className="form-label fw-semibold text-secondary small">
                        Main image URL
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-primary-subtle text-primary">
                          <ImageIcon size={18} />
                        </span>
                        <input
                          className="form-control bg-body"
                          value={form.image_url}
                          onChange={(event) =>
                            updateField("image_url", event.target.value)
                          }
                          placeholder="https://example.com/product-image.jpg"
                        />
                      </div>
                      <div className="form-text">
                        Use a publicly accessible image URL.
                      </div>
                    </div>

                    {form.image_url && (
                      <div className="card border border-primary-subtle bg-body rounded-4 mb-4">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={form.image_url}
                              alt="Product preview"
                              className="rounded-3 border bg-body-tertiary"
                              width={100}
                              height={100}
                              style={{ objectFit: "contain" }}
                            />
                            <div className="flex-grow-1 min-w-0">
                              <div className="fw-bold">Main image preview</div>
                              <div className="small text-secondary text-break">
                                {form.image_url}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => updateField("image_url", "")}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label fw-semibold text-secondary small">
                        Gallery image URLs
                      </label>
                      <textarea
                        className="form-control bg-body"
                        rows={4}
                        value={galleryInput}
                        onChange={(event) =>
                          setGalleryInput(event.target.value)
                        }
                        placeholder={"Paste one image URL per line\nhttps://example.com/image-2.jpg"}
                      />
                      <div className="form-text">
                        You can paste multiple URLs separated by new lines or commas.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary bg-gradient rounded-3 mb-4"
                      onClick={addGalleryImages}
                    >
                      <ImageIcon size={17} className="me-2" />
                      Add gallery images
                    </button>

                    {form.gallery_urls.length > 0 && (
                      <div className="row row-cols-2 row-cols-md-3 g-3">
                        {form.gallery_urls.map((url, index) => (
                          <div className="col" key={`${url}-${index}`}>
                            <div className="card h-100 border border-primary-subtle rounded-3 overflow-hidden">
                              <img
                                src={url}
                                alt={`Gallery image ${index + 1}`}
                                className="card-img-top bg-body-tertiary"
                                style={{ height: 150, objectFit: "contain" }}
                              />
                              <div className="card-body p-2">
                                <div className="small text-secondary text-break">
                                  Image {index + 1}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm w-100 mt-2"
                                  onClick={() =>
                                    updateField(
                                      "gallery_urls",
                                      form.gallery_urls.filter(
                                        (_, imageIndex) =>
                                          imageIndex !== index
                                      )
                                    )
                                  }
                                >
                                  <X size={14} className="me-1" />
                                  Remove image
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {step === 3 && (
                  <>
                    <SectionHeading
                      eyebrow="Product information"
                      title="Specifications"
                      description="Add technical details and attributes to help customers compare products."
                    />

                    <div className="d-flex flex-wrap gap-2 mb-4">
                      {SPECIFICATION_FIELDS.map((name) => (
                        <button
                          type="button"
                          key={name}
                          className="btn btn-sm btn-outline-primary bg-gradient rounded-pill"
                          onClick={() => addSpecification(name)}
                        >
                          <span className="me-1">+</span>
                          {name}
                        </button>
                      ))}
                    </div>

                    {form.specifications.length === 0 ? (
                      <div className="text-center border border-dashed rounded-4 bg-body p-4 p-lg-5">
                        <Layers3 size={32} className="text-primary mb-3" />
                        <h6 className="fw-bold">No specifications yet</h6>
                        <p className="text-secondary small mb-3">
                          Add a suggested field above or create a custom specification.
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary bg-gradient"
                          onClick={() => addSpecification()}
                        >
                          Add specification
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {form.specifications.map((item, index) => (
                          <div
                            className="rounded-3 border border-primary-subtle bg-body p-3"
                            key={index}
                          >
                            <div className="row align-items-end g-2">
                              <div className="col-md-5">
                                <Field
                                  label="Specification name"
                                  value={item.name}
                                  onChange={(value) =>
                                    updateSpecification(index, "name", value)
                                  }
                                  placeholder="e.g. Material"
                                />
                              </div>
                              <div className="col-md-5">
                                <Field
                                  label="Specification value"
                                  value={item.value}
                                  onChange={(value) =>
                                    updateSpecification(index, "value", value)
                                  }
                                  placeholder="e.g. Premium cotton"
                                />
                              </div>
                              <div className="col-md-2 mb-3">
                                <button
                                  type="button"
                                  className="btn btn-outline-danger w-100"
                                  onClick={() => removeSpecification(index)}
                                  aria-label="Remove specification"
                                >
                                  <X size={17} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-outline-primary bg-gradient align-self-start"
                          onClick={() => addSpecification()}
                        >
                          + Add another specification
                        </button>
                      </div>
                    )}
                  </>
                )}

                {step === 4 && (
                  <>
                    <SectionHeading
                      eyebrow="Order fulfilment"
                      title="Shipping and returns"
                      description="Configure product dimensions, delivery options, cash on delivery and returns."
                    />

                    <div className="row g-3">
                      {(
                        [
                          ["weight", "Weight", "kg"],
                          ["length", "Length", "cm"],
                          ["width", "Width", "cm"],
                          ["height", "Height", "cm"],
                        ] as const
                      ).map(([key, label, unit]) => (
                        <div className="col-md-6" key={key}>
                          <label className="form-label fw-semibold text-secondary small">
                            {label}
                          </label>
                          <div className="input-group">
                            <input
                              className="form-control bg-body"
                              type="number"
                              min="0"
                              step="0.01"
                              value={form[key]}
                              onChange={(event) =>
                                updateField(key, event.target.value)
                              }
                              placeholder={`Enter ${label.toLowerCase()}`}
                            />
                            <span className="input-group-text bg-body-secondary text-secondary">
                              {unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <hr className="my-4 border-primary-subtle" />

                    <h6 className="fw-bold mb-3">Delivery options</h6>

                    <div className="d-flex flex-column gap-3">
                      {(
                        [
                          [
                            "free_shipping",
                            "Free shipping",
                            "Offer free shipping for this product.",
                          ],
                          [
                            "cod_available",
                            "Cash on delivery",
                            "Allow customers to pay on delivery.",
                          ],
                          [
                            "return_available",
                            "Returns accepted",
                            "Allow customers to request a return.",
                          ],
                        ] as const
                      ).map(([key, label, description]) => (
                        <div
                          className="rounded-3 border border-primary-subtle bg-body p-3"
                          key={key}
                        >
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={key}
                              checked={form[key]}
                              onChange={(event) =>
                                updateField(key, event.target.checked)
                              }
                            />
                            <label
                              className="form-check-label fw-semibold"
                              htmlFor={key}
                            >
                              {label}
                            </label>
                          </div>
                          <div className="small text-secondary ms-4">
                            {description}
                          </div>
                        </div>
                      ))}
                    </div>

                    {form.return_available && (
                      <div className="mt-4">
                        <Field
                          label="Return window"
                          value={form.return_days}
                          onChange={(value) =>
                            updateField("return_days", value)
                          }
                          type="number"
                          min={0}
                          step={1}
                          placeholder="7"
                          help="Number of days after delivery in which a return may be requested."
                        />
                      </div>
                    )}
                  </>
                )}

                {step === 5 && (
                  <>
                    <SectionHeading
                      eyebrow="Search optimisation"
                      title="SEO details"
                      description="Improve how the product appears in search results and shared links."
                    />

                    <Field
                      label="SEO title"
                      value={form.seo_title}
                      onChange={(value) => updateField("seo_title", value)}
                      placeholder="Product title for search engines"
                      help={`${form.seo_title.length}/60 characters recommended`}
                    />

                    <TextAreaField
                      label="Meta description"
                      value={form.meta_description}
                      onChange={(value) =>
                        updateField("meta_description", value)
                      }
                      placeholder="Write a short, helpful summary of this product."
                      rows={4}
                      help={`${form.meta_description.length}/160 characters recommended`}
                    />

                    <Field
                      label="SEO keywords"
                      value={form.seo_keywords}
                      onChange={(value) => updateField("seo_keywords", value)}
                      placeholder="keyword one, keyword two, keyword three"
                    />

                    <Field
                      label="Canonical URL"
                      value={form.canonical_url}
                      onChange={(value) => updateField("canonical_url", value)}
                      placeholder="https://example.com/products/product-slug"
                    />

                    <div className="rounded-3 border border-primary-subtle bg-body p-3 mt-4">
                      <div className="small fw-bold text-primary mb-2">
                        SEARCH RESULT PREVIEW
                      </div>
                      <div className="fw-semibold text-primary text-break">
                        {form.seo_title || form.name || "Your product title"}
                      </div>
                      <div className="small text-success text-break">
                        {form.canonical_url ||
                          `/products/${form.slug || "your-product"}`}
                      </div>
                      <p className="small text-secondary mb-0 mt-1">
                        {form.meta_description ||
                          form.short_description ||
                          "Your product description will appear here."}
                      </p>
                    </div>
                  </>
                )}

                {step === 6 && (
                  <>
                    <SectionHeading
                      eyebrow="Final verification"
                      title="Review your product"
                      description="Check the information below before saving your product."
                    />

                    <div className="rounded-4 border border-primary-subtle bg-body p-3 p-lg-4 mb-4">
                      <div className="d-flex flex-wrap align-items-start gap-3">
                        {form.image_url ? (
                          <img
                            src={form.image_url}
                            alt={form.name || "Product"}
                            width={112}
                            height={112}
                            className="rounded-3 border bg-body-tertiary"
                            style={{ objectFit: "contain" }}
                          />
                        ) : (
                          <div
                            className="rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                            style={{ width: 112, height: 112 }}
                          >
                            <Package size={36} />
                          </div>
                        )}

                        <div className="flex-grow-1">
                          <span className="badge rounded-pill text-bg-primary bg-gradient mb-2">
                            {selectedType.label}
                          </span>
                          <h5 className="fw-bold mb-1">
                            {form.name || "Untitled product"}
                          </h5>
                          <p className="text-secondary small mb-2">
                            {form.brand || "No brand specified"}
                            {form.sku ? ` · SKU: ${form.sku}` : ""}
                          </p>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="fs-4 fw-bold text-primary-emphasis">
                              ₹{formatPrice(form.price)}
                            </span>
                            {Number(form.mrp || 0) > Number(form.price || 0) && (
                              <span className="text-secondary text-decoration-line-through">
                                ₹{formatPrice(form.mrp)}
                              </span>
                            )}
                            {discount > 0 && (
                              <span className="badge text-bg-success">
                                {discount}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row g-3">
                      {[
                        {
                          label: "Category ID",
                          value: form.category_id || "Not set",
                        },
                        {
                          label: "Available stock",
                          value: form.stock || "0",
                        },
                        {
                          label: "Product status",
                          value: form.status,
                        },
                        {
                          label: "Gallery images",
                          value: String(form.gallery_urls.length),
                        },
                        {
                          label: "Specifications",
                          value: String(form.specifications.length),
                        },
                        {
                          label: "Shipping",
                          value: form.free_shipping
                            ? "Free shipping"
                            : "Standard shipping",
                        },
                      ].map((item) => (
                        <div className="col-md-6" key={item.label}>
                          <div className="rounded-3 border border-primary-subtle bg-body p-3 h-100">
                            <div className="small text-secondary mb-1">
                              {item.label}
                            </div>
                            <div className="fw-bold text-break">
                              {item.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="alert alert-info border-0 rounded-3 mt-4 mb-0">
                      <div className="d-flex gap-2">
                        <ShieldCheck size={20} className="flex-shrink-0" />
                        <div className="small">
                          Review the product details, price, category and image before saving. The product will be submitted to your existing product API.
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-top border-primary-subtle mt-4 pt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary bg-gradient rounded-3 px-3"
                    onClick={goBack}
                    disabled={step === 0 || saving}
                  >
                    <ArrowLeft size={17} className="me-2" />
                    Previous
                  </button>

                  <div className="d-flex flex-wrap gap-2">
                    <Link
                      href="/admin/products"
                      className="btn btn-light border rounded-3 px-3"
                    >
                      Cancel
                    </Link>

                    {step < STEPS.length - 1 ? (
                      <button
                        type="button"
                        className="btn btn-primary bg-gradient rounded-3 px-4"
                        onClick={goNext}
                      >
                        Continue
                        <ArrowRight size={17} className="ms-2" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary bg-gradient rounded-3 px-4"
                        onClick={saveProduct}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              aria-hidden="true"
                            />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={17} className="me-2" />
                            {isEdit ? "Save changes" : "Create product"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="col-xl-4">
            <div className="card border border-primary-subtle bg-body-tertiary rounded-4 shadow-sm mb-4">
              <div className="card-header bg-body-tertiary border-bottom border-primary-subtle p-3">
                <h6 className="fw-bold mb-0">
                  <Sparkles size={17} className="text-primary me-2" />
                  Live product summary
                </h6>
              </div>
              <div className="card-body p-3">
                <div className="d-flex align-items-start gap-3 mb-3">
                  {form.image_url ? (
                    <img
                      src={form.image_url}
                      alt={form.name || "Product preview"}
                      width={76}
                      height={76}
                      className="rounded-3 border bg-body"
                      style={{ objectFit: "contain" }}
                    />
                  ) : (
                    <div
                      className="rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                      style={{ width: 76, height: 76 }}
                    >
                      <ImageIcon size={26} />
                    </div>
                  )}
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-bold text-break">
                      {form.name || "Product name"}
                    </div>
                    <div className="small text-secondary">
                      {form.brand || "Brand not set"}
                    </div>
                    <span className="badge bg-primary-subtle text-primary-emphasis mt-2">
                      {selectedType.label}
                    </span>
                  </div>
                </div>

                <div className="rounded-3 bg-body border border-primary-subtle p-3 mb-3">
                  <div className="small text-secondary mb-1">
                    Selling price
                  </div>
                  <div className="h3 fw-bold text-primary-emphasis mb-0">
                    ₹{formatPrice(form.price)}
                  </div>
                  {discount > 0 && (
                    <div className="small text-success fw-semibold mt-1">
                      Save {discount}% · ₹{formatPrice(savings)}
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="small text-secondary">Stock</span>
                  <span className="fw-semibold">
                    {Number(form.stock || 0).toLocaleString("en-IN")} units
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="small text-secondary">Status</span>
                  <span
                    className={`badge ${
                      form.status === "ACTIVE"
                        ? "text-bg-success"
                        : form.status === "DRAFT"
                          ? "text-bg-warning"
                          : "text-bg-secondary"
                    }`}
                  >
                    {form.status}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="small text-secondary">Gallery images</span>
                  <span className="fw-semibold">{form.gallery_urls.length}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2">
                  <span className="small text-secondary">Specifications</span>
                  <span className="fw-semibold">
                    {form.specifications.filter(
                      (item) => item.name.trim() && item.value.trim()
                    ).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="card border border-primary-subtle bg-body-tertiary rounded-4 shadow-sm">
              <div className="card-body p-3 p-lg-4">
                <div className="rounded-3 bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center p-2 mb-3">
                  <ShieldCheck size={22} />
                </div>
                <h6 className="fw-bold">Product setup checklist</h6>
                <p className="small text-secondary">
                  Use this checklist to help ensure the product information is complete.
                </p>

                {[
                  ["Product name", Boolean(form.name.trim())],
                  ["Category ID", Boolean(form.category_id.trim())],
                  ["Selling price", form.price !== "" && Number(form.price) >= 0],
                  ["Stock quantity", form.stock !== "" && Number(form.stock) >= 0],
                  ["Main image", Boolean(form.image_url.trim())],
                ].map(([label, complete]) => (
                  <div
                    className="d-flex align-items-center gap-2 mb-3"
                    key={String(label)}
                  >
                    <span
                      className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                        complete
                          ? "bg-success-subtle text-success"
                          : "bg-body-secondary text-secondary"
                      }`}
                      style={{ width: 24, height: 24 }}
                    >
                      {complete ? <Check size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span
                      className={`small ${
                        complete ? "text-body" : "text-secondary"
                      }`}
                    >
                      {String(label)}
                    </span>
                  </div>
                ))}

                <div className="small text-secondary border-top border-primary-subtle pt-3">
                  Required details must be completed before the product can be saved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
