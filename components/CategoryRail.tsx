import Link from "next/link";

const cats = [
  ["Electronics","electronics","https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500"],
  ["Fashion","fashion","https://images.unsplash.com/photo-1445205170230-053b83016050?w=500"],
  ["Home","home","https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500"],
  ["Beauty","beauty","https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500"],
  ["Sports","sports","https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500"],
  ["Gadgets","gadgets","https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500"]
];

export default function CategoryRail() {
  return <section className="container section">
    <div className="section-head"><div><span className="eyebrow">CURATED DEPARTMENTS</span><h2>Find your next favourite</h2></div><Link href="/products">View all →</Link></div>
    <div className="category-rail">
      {cats.map(([name, slug, img]) => <Link href={`/products?category=${slug}`} className="category-card" key={slug}>
        <img src={img} alt={name}/><span>{name}</span>
      </Link>)}
    </div>
  </section>;
}
