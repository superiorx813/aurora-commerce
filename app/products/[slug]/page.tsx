import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import ProductActions from "@/components/ProductActions";
import ProductGallery from "@/components/ProductGallery";

import { money, discountPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type GalleryImage = {
  id?: number;
  image_url: string;
  alt_text?: string | null;
  sort_order?: number;
  is_primary?: number | boolean;
};

type ShippingInfo = {
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  free_shipping?: number | boolean;
  cod_available?: number | boolean;
  return_available?: number | boolean;
  return_days?: number | null;
};

type Specification = {
  specification_group: string;
  specification_key: string;
  specification_value: string;
  sort_order?: number;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;

  const [rows] = await db.query(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.image_url,
        s.seo_title,
        s.meta_description,
        s.canonical_url
      FROM products p
      LEFT JOIN product_seo s
        ON s.product_id = p.id
      WHERE p.slug = ?
      LIMIT 1
    `,
    [slug]
  );

  const product = (rows as any[])[0];

  if (!product) {
    return {
      title: "Product not found | Aurora",
    };
  }

  return {
    title:
      product.seo_title ||
      `${product.name} | Aurora Commerce`,

    description:
      product.meta_description ||
      product.description ||
      `Shop ${product.name} at Aurora Commerce.`,

    alternates: product.canonical_url
      ? {
          canonical: product.canonical_url,
        }
      : undefined,

    openGraph: {
      title:
        product.seo_title ||
        product.name,

      description:
        product.meta_description ||
        product.description ||
        `Shop ${product.name} at Aurora Commerce.`,

      images: product.image_url
        ? [product.image_url]
        : [],
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  // =========================================================
  // PRODUCT
  // =========================================================

  const [rows] = await db.query(
    `
      SELECT
        p.*,
        c.name AS category_name,
        c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE p.slug = ?
      LIMIT 1
    `,
    [slug]
  );

  const product = (rows as any[])[0];

  if (!product) {
    notFound();
  }

  // =========================================================
  // GALLERY
  // =========================================================

  const [galleryRows] = await db.query(
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
    [product.id]
  );

  let galleryImages = galleryRows as GalleryImage[];

  // ---------------------------------------------------------
  // FALLBACK TO gallery_json
  // ---------------------------------------------------------

  if (galleryImages.length === 0 && product.gallery_json) {
    try {
      const parsed =
        typeof product.gallery_json === "string"
          ? JSON.parse(product.gallery_json)
          : product.gallery_json;

      if (Array.isArray(parsed)) {
        galleryImages = parsed
          .map((item: any) => {
            if (typeof item === "string") {
              return {
                image_url: item,
                alt_text: product.name,
              };
            }

            if (item?.image_url) {
              return {
                image_url: item.image_url,
                alt_text:
                  item.alt_text || product.name,
              };
            }

            return null;
          })
          .filter(Boolean);
      }
    } catch {
      // Ignore invalid gallery JSON.
    }
  }

  // ---------------------------------------------------------
  // ALWAYS INCLUDE MAIN IMAGE
  // ---------------------------------------------------------

  if (
    product.image_url &&
    !galleryImages.some(
      (image) => image.image_url === product.image_url
    )
  ) {
    galleryImages.unshift({
      image_url: product.image_url,
      alt_text: product.name,
      is_primary: 1,
    });
  }

  // =========================================================
  // SHIPPING
  // =========================================================

  const [shippingRows] = await db.query(
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
    [product.id]
  );

  const shipping =
    ((shippingRows as any[])[0] as ShippingInfo | undefined) ||
    null;

  // =========================================================
  // SPECIFICATIONS
  // =========================================================

  const [specRows] = await db.query(
    `
      SELECT
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
    [product.id]
  );

  const specifications =
    specRows as Specification[];

  // =========================================================
  // RELATED PRODUCTS
  // =========================================================

  const [relatedRows] = await db.query(
    `
      SELECT
        p.*,
        c.name AS category_name,
        c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE
        p.category_id = ?
        AND p.id <> ?
        AND p.status = 'ACTIVE'
      ORDER BY
        p.featured DESC,
        p.created_at DESC
      LIMIT 4
    `,
    [product.category_id, product.id]
  );

  const related = relatedRows as any[];

  const price = Number(product.price);
  const mrp = Number(product.mrp);

  const discount =
    mrp > price
      ? discountPercent(price, mrp)
      : 0;

  const stock = Number(product.stock || 0);

  const rating = Number(product.rating || 0);

  const reviewCount =
    Number(product.review_count || 0);

  const returnDays =
    Number(shipping?.return_days || 0);

  return (
    <main className="product-detail-page">
      <div className="container page-shell">

        {/* ===================================================
            BREADCRUMBS
        =================================================== */}

        <div className="aurora-breadcrumbs">
          <span>Home</span>
          <b>/</b>

          {product.category_name && (
            <>
              <span>{product.category_name}</span>
              <b>/</b>
            </>
          )}

          <strong>{product.name}</strong>
        </div>

        {/* ===================================================
            MAIN PRODUCT
        =================================================== */}

        <section className="aurora-product-layout">

          {/* LEFT : GALLERY */}

          <div className="aurora-product-media">
            <ProductGallery
              images={galleryImages}
              productName={product.name}
            />
          </div>

          {/* RIGHT : PRODUCT INFORMATION */}

          <div className="aurora-product-info">

            {/* Brand / type */}

            <div className="product-meta-top">
              {product.brand && (
                <span className="product-brand-label">
                  {product.brand}
                </span>
              )}

              {product.product_type && (
                <span className="product-type-label">
                  {product.product_type}
                </span>
              )}
            </div>

            {/* Product name */}

            <h1 className="aurora-product-title">
              {product.name}
            </h1>

            {/* Rating */}

            <div className="aurora-product-rating">

              <span className="rating-pill">
                {rating.toFixed(1)} ★
              </span>

              <span className="rating-reviews">
                {reviewCount}{" "}
                {reviewCount === 1
                  ? "review"
                  : "reviews"}
              </span>

            </div>

            {/* Short description */}

            {product.short_description && (
              <p className="aurora-short-description">
                {product.short_description}
              </p>
            )}

            {/* Full description */}

            {!product.short_description &&
              product.description && (
                <p className="aurora-short-description">
                  {product.description}
                </p>
              )}

            {/* Price */}

            <div className="aurora-price-block">

              <div className="aurora-price-main">
                {money(price)}
              </div>

              {mrp > price && (
                <>
                  <del>{money(mrp)}</del>

                  <span className="aurora-discount">
                    {discount}% OFF
                  </span>
                </>
              )}

            </div>

            {/* Stock */}

            <div
              className={`aurora-stock-status ${
                stock <= 0
                  ? "out"
                  : stock <= 5
                  ? "low"
                  : "available"
              }`}
            >
              <span className="stock-dot" />

              {stock <= 0
                ? "Out of stock"
                : stock <= 5
                ? `Only ${stock} left in stock`
                : "In stock"}
            </div>

            {/* Shipping */}

            <div className="aurora-benefits-card">

              <div className="benefit-row">
                <div className="benefit-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    {shipping?.free_shipping
                      ? "Free delivery"
                      : "Delivery available"}
                  </strong>

                  <span>
                    Usually dispatched within 24 hours
                  </span>
                </div>
              </div>

              <div className="benefit-row">
                <div className="benefit-icon">
                  ₹
                </div>

                <div>
                  <strong>
                    {shipping?.cod_available
                      ? "Cash on Delivery available"
                      : "Secure online payments"}
                  </strong>

                  <span>
                    Multiple secure payment options
                  </span>
                </div>
              </div>

              <div className="benefit-row">
                <div className="benefit-icon">
                  ↩
                </div>

                <div>
                  <strong>
                    {shipping?.return_available
                      ? `${returnDays || 7}-day easy returns`
                      : "Returns unavailable"}
                  </strong>

                  <span>
                    Check product condition before returning
                  </span>
                </div>
              </div>

            </div>

            {/* Existing actions */}

            <div className="aurora-action-wrapper">
              <ProductActions
                product={product}
              />
            </div>

            {/* Trust points */}

            <div className="aurora-trust-row">
              <span>✓ Genuine products</span>
              <span>✓ Secure payments</span>
              <span>✓ Easy returns</span>
            </div>

            {/* SKU */}

            {product.sku && (
              <div className="aurora-product-identifiers">
                <div>
                  <span>SKU</span>
                  <strong>{product.sku}</strong>
                </div>

                {product.product_type && (
                  <div>
                    <span>TYPE</span>
                    <strong>
                      {product.product_type}
                    </strong>
                  </div>
                )}
              </div>
            )}

          </div>
        </section>

        {/* ===================================================
            PRODUCT INFORMATION
        =================================================== */}

        <section className="aurora-information-section">

          <div className="aurora-info-heading">
            <span className="eyebrow">
              PRODUCT INFORMATION
            </span>

            <h2>
              Everything you need to know
            </h2>
          </div>

          <div className="aurora-info-grid">

            {/* DESCRIPTION */}

            <div className="aurora-info-card aurora-description-card">

              <div className="info-card-number">
                01
              </div>

              <h3>
                About this product
              </h3>

              {product.description ? (
                <p>
                  {product.description}
                </p>
              ) : (
                <p className="muted-info">
                  Product description is not
                  available yet.
                </p>
              )}

            </div>

            {/* SHIPPING */}

            <div className="aurora-info-card">

              <div className="info-card-number">
                02
              </div>

              <h3>
                Delivery & returns
              </h3>

              <div className="info-list">

                <div>
                  <span>Shipping</span>

                  <strong>
                    {shipping?.free_shipping
                      ? "Free delivery"
                      : "Standard delivery"}
                  </strong>
                </div>

                <div>
                  <span>COD</span>

                  <strong>
                    {shipping?.cod_available
                      ? "Available"
                      : "Not available"}
                  </strong>
                </div>

                <div>
                  <span>Returns</span>

                  <strong>
                    {shipping?.return_available
                      ? `${returnDays || 7} days`
                      : "Not available"}
                  </strong>
                </div>

              </div>

            </div>

            {/* PACKAGE */}

            <div className="aurora-info-card">

              <div className="info-card-number">
                03
              </div>

              <h3>
                Package details
              </h3>

              {shipping ? (
                <div className="info-list">

                  {shipping.weight != null && (
                    <div>
                      <span>Weight</span>
                      <strong>
                        {shipping.weight} kg
                      </strong>
                    </div>
                  )}

                  {shipping.length != null &&
                    shipping.width != null &&
                    shipping.height != null && (
                      <div>
                        <span>Dimensions</span>
                        <strong>
                          {shipping.length} ×{" "}
                          {shipping.width} ×{" "}
                          {shipping.height} cm
                        </strong>
                      </div>
                    )}

                </div>
              ) : (
                <p className="muted-info">
                  Package information is not
                  available yet.
                </p>
              )}

            </div>

          </div>
        </section>

        {/* ===================================================
            SPECIFICATIONS
        =================================================== */}

        {specifications.length > 0 && (
          <section className="aurora-specifications-section">

            <div className="aurora-info-heading">
              <span className="eyebrow">
                SPECIFICATIONS
              </span>

              <h2>
                Product specifications
              </h2>
            </div>

            <div className="aurora-specifications">

              {Object.entries(
                specifications.reduce(
                  (
                    groups: Record<
                      string,
                      Specification[]
                    >,
                    item
                  ) => {
                    const group =
                      item.specification_group ||
                      "General";

                    if (!groups[group]) {
                      groups[group] = [];
                    }

                    groups[group].push(item);

                    return groups;
                  },
                  {}
                )
              ).map(
                ([groupName, items]) => (
                  <div
                    className="aurora-spec-group"
                    key={groupName}
                  >

                    <div className="spec-group-title">
                      {groupName}
                    </div>

                    <div className="spec-group-body">

                      {items.map(
                        (item, index) => (
                          <div
                            className="spec-row"
                            key={`${item.specification_key}-${index}`}
                          >
                            <span>
                              {item.specification_key}
                            </span>

                            <strong>
                              {item.specification_value}
                            </strong>
                          </div>
                        )
                      )}

                    </div>

                  </div>
                )
              )}

            </div>
          </section>
        )}

        {/* ===================================================
            RELATED PRODUCTS
        =================================================== */}

        {related.length > 0 && (
          <section className="section aurora-related-section">

            <div className="section-head">

              <div>
                <span className="eyebrow">
                  YOU MAY ALSO LIKE
                </span>

                <h2>
                  More from this collection
                </h2>
              </div>

            </div>

            <div className="product-grid">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                />
              ))}
            </div>

          </section>
        )}

      </div>
    </main>
  );
}