import Link from "next/link";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import CategoryRail from "@/components/CategoryRail";

export const dynamic = "force-dynamic";

async function getFeatured() {
  const [rows] = await db.query(`
    SELECT p.*, c.name category_name, c.slug category_slug
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.featured = 1
    ORDER BY p.created_at DESC
    LIMIT 8
  `);

  return rows as any[];
}

export default async function Home() {
  const products = await getFeatured();

  return (
    <main className="bg-light">
      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="bg-dark text-white overflow-hidden">
        <div className="container py-5">
          <div className="row align-items-center g-5 py-lg-5">

            {/* Hero Content */}
            <div className="col-lg-6">
              <div className="mb-3">
                <span className="badge rounded-pill bg-primary bg-opacity-25 text-info border border-info border-opacity-25 px-3 py-2">
                  ✦ THE AURORA EDIT · 2026
                </span>
              </div>

              <h1 className="display-3 fw-bold lh-1 mb-4">
                Shopping with a
                <span className="text-info d-block">
                  little more spark.
                </span>
              </h1>

              <p className="lead text-white-50 mb-4 pe-lg-5">
                A premium marketplace for everyday essentials, statement
                pieces and smart finds — curated instead of crowded.
              </p>

              <div className="d-flex flex-wrap gap-3 mb-5">
                <Link
                  href="/products"
                  className="btn btn-info btn-lg rounded-pill px-4 fw-semibold"
                >
                  Explore Collection
                  <span className="ms-2">→</span>
                </Link>

                <Link
                  href="/products?sort=featured"
                  className="btn btn-outline-light btn-lg rounded-pill px-4"
                >
                  See Trending
                </Link>
              </div>

              {/* Hero Stats */}
              <div className="row g-3">
                <div className="col-4">
                  <div className="border-start border-info border-3 ps-3">
                    <div className="fs-4 fw-bold">10k+</div>
                    <div className="small text-white-50">
                      Curated finds
                    </div>
                  </div>
                </div>

                <div className="col-4">
                  <div className="border-start border-primary border-3 ps-3">
                    <div className="fs-4 fw-bold">4.8/5</div>
                    <div className="small text-white-50">
                      Shopper rating
                    </div>
                  </div>
                </div>

                <div className="col-4">
                  <div className="border-start border-warning border-3 ps-3">
                    <div className="fs-4 fw-bold">24h</div>
                    <div className="small text-white-50">
                      Dispatch promise
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="col-lg-6">
              <div className="position-relative">

                {/* Main Image */}
                <div className="rounded-5 overflow-hidden shadow-lg border border-white border-opacity-10">
                  <img
                    src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200"
                    alt="Featured camera"
                    className="img-fluid w-100"
                    style={{
                      height: "520px",
                      objectFit: "cover",
                    }}
                  />
                </div>

                {/* Floating Product Card */}
                <div className="position-absolute bottom-0 start-0 translate-middle-y ms-3">
                  <div className="bg-white text-dark rounded-4 shadow-lg p-3">
                    <div className="small text-secondary mb-1">
                      AURORA PICK
                    </div>

                    <div className="fw-bold fs-5">
                      Objects worth
                    </div>

                    <div className="fw-bold fs-5">
                      keeping.
                    </div>

                    <div className="small text-primary mt-2">
                      01 / 06
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="position-absolute top-0 end-0 translate-middle-y me-3">
                  <div className="bg-info text-dark rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                    style={{
                      width: "100px",
                      height: "100px",
                    }}
                  >
                    <div className="text-center">
                      <div className="fw-bold">NEW</div>
                      <div className="small">ARRIVALS</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          CATEGORY RAIL
      ========================================================= */}
      <section className="bg-white border-bottom">
        <div className="container py-4">
          <CategoryRail />
        </div>
      </section>

      {/* =========================================================
          FEATURED PRODUCTS
      ========================================================= */}
      <section className="container py-5">

        <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3 mb-4">

          <div>
            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2 mb-2">
              EDITOR'S PICKS
            </span>

            <h2 className="display-6 fw-bold mb-1">
              Popular right now
            </h2>

            <p className="text-secondary mb-0">
              Handpicked products making waves across Aurora.
            </p>
          </div>

          <Link
            href="/products?sort=popular"
            className="btn btn-outline-dark rounded-pill px-4"
          >
            Explore all
            <span className="ms-2">→</span>
          </Link>

        </div>

        {products.length > 0 ? (
          <div className="row g-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="col-12 col-sm-6 col-lg-3"
              >
                <div className="h-100">
                  <ProductCard product={product} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-4 border p-5 text-center shadow-sm">
            <div className="display-5 mb-3">✦</div>

            <h4 className="fw-bold">
              Something exciting is coming
            </h4>

            <p className="text-secondary mb-4">
              We are preparing our latest curated collection.
            </p>

            <Link
              href="/products"
              className="btn btn-dark rounded-pill px-4"
            >
              Browse Products
            </Link>
          </div>
        )}

      </section>

      {/* =========================================================
          AURORA EXPERIENCE STRIP
      ========================================================= */}
      <section className="container pb-5">

        <div className="row g-3">

          <div className="col-md-4">
            <div className="bg-white border rounded-4 p-4 h-100 shadow-sm">
              <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "52px",
                  height: "52px",
                }}
              >
                ✦
              </div>

              <h5 className="fw-bold">
                Curated collections
              </h5>

              <p className="text-secondary mb-0">
                Discover products selected to make everyday shopping
                feel more inspiring.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="bg-white border rounded-4 p-4 h-100 shadow-sm">
              <div className="rounded-circle bg-info bg-opacity-10 text-info d-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "52px",
                  height: "52px",
                }}
              >
                ⚡
              </div>

              <h5 className="fw-bold">
                Quick delivery
              </h5>

              <p className="text-secondary mb-0">
                Fast dispatch and a smooth order experience from
                checkout to delivery.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="bg-white border rounded-4 p-4 h-100 shadow-sm">
              <div className="rounded-circle bg-warning bg-opacity-10 text-warning d-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "52px",
                  height: "52px",
                }}
              >
                ♡
              </div>

              <h5 className="fw-bold">
                Made for you
              </h5>

              <p className="text-secondary mb-0">
                Explore collections designed around what you actually
                want to discover.
              </p>
            </div>
          </div>

        </div>

      </section>

      {/* =========================================================
          AURORA MEMBERS
      ========================================================= */}
      <section className="container pb-5">

        <div className="bg-dark text-white rounded-5 overflow-hidden shadow-lg">

          <div className="row align-items-center g-0">

            <div className="col-lg-8">
              <div className="p-4 p-md-5">

                <span className="badge rounded-pill bg-info text-dark px-3 py-2 mb-3">
                  AURORA MEMBERS
                </span>

                <h2 className="display-6 fw-bold mb-3">
                  Unlock a better way
                  <span className="text-info"> to shop.</span>
                </h2>

                <p className="text-white-50 fs-5 mb-4">
                  Get early access, member-only drops and personalised
                  collections designed around your style.
                </p>

                <div className="d-flex flex-wrap gap-2 mb-4">
                  <span className="badge bg-white bg-opacity-10 border border-white border-opacity-10 rounded-pill px-3 py-2">
                    ✓ Early access
                  </span>

                  <span className="badge bg-white bg-opacity-10 border border-white border-opacity-10 rounded-pill px-3 py-2">
                    ✓ Exclusive drops
                  </span>

                  <span className="badge bg-white bg-opacity-10 border border-white border-opacity-10 rounded-pill px-3 py-2">
                    ✓ Personalised picks
                  </span>
                </div>

                <Link
                  href="/account"
                  className="btn btn-info btn-lg rounded-pill px-4 fw-semibold"
                >
                  Join Free
                  <span className="ms-2">→</span>
                </Link>

              </div>
            </div>

            <div className="col-lg-4 d-none d-lg-block">
              <div className="p-4">

                <div className="bg-white bg-opacity-10 border border-white border-opacity-10 rounded-5 p-4">

                  <div className="small text-white-50 mb-3">
                    AURORA MEMBER
                  </div>

                  <div className="display-5 fw-bold mb-2">
                    ✦
                  </div>

                  <div className="fw-semibold fs-5">
                    Your shopping universe.
                  </div>

                  <div className="small text-white-50 mt-2">
                    Discover. Save. Enjoy.
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>

      </section>
    </main>
  );
}