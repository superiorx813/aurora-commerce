import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  const q = params.q || "";
  const category = params.category || "";
  const sort = params.sort || "newest";
  const order = sort === "price-low" ? "p.price ASC" : sort === "price-high" ? "p.price DESC" : sort === "popular" ? "p.rating DESC" : "p.created_at DESC";

  const [rows] = await db.query(`
    SELECT p.*, c.name category_name, c.slug category_slug
    FROM products p LEFT JOIN categories c ON c.id=p.category_id
    WHERE (? = '' OR p.name LIKE CONCAT('%', ?, '%') OR p.brand LIKE CONCAT('%', ?, '%') OR p.description LIKE CONCAT('%', ?, '%'))
      AND (? = '' OR c.slug = ?)
    ORDER BY ${order}
    LIMIT 48
  `, [q,q,q,q,category,category]);

  const products = rows as any[];

  return <div className="container page-shell">
    <div className="page-heading"><span className="eyebrow">DISCOVER</span><h1>{q ? `Results for “${q}”` : category ? category.replace("-", " ") : "All products"}</h1><p>{products.length} carefully selected products</p></div>
    <div className="filter-row">
      <a className={!category ? "active" : ""} href="/products">All</a>
      <a href="/products?category=electronics">Electronics</a><a href="/products?category=fashion">Fashion</a><a href="/products?category=home">Home</a><a href="/products?category=beauty">Beauty</a>
      <span className="filter-spacer"/><a href={`/products?${new URLSearchParams({...(q?{q}:{}),...(category?{category}:{}),sort:"price-low"}).toString()}`}>Price low</a><a href={`/products?${new URLSearchParams({...(q?{q}:{}),...(category?{category}:{}),sort:"price-high"}).toString()}`}>Price high</a>
    </div>
    <div className="product-grid">{products.map(p => <ProductCard key={p.id} product={p}/>)}</div>
    {products.length === 0 && <div className="empty-state"><h3>No products found</h3><p>Try another search or category.</p></div>}
  </div>;
}
