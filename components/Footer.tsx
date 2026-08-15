import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand"><span className="brand-mark">A</span>AURORA</div>
          <p>Premium shopping, redesigned around discovery.</p>
        </div>
        <div><h4>Shop</h4><Link href="/products">All products</Link><Link href="/products?category=electronics">Electronics</Link><Link href="/products?category=fashion">Fashion</Link></div>
        <div><h4>Help</h4><Link href="/account">My account</Link><Link href="/orders">Orders</Link><Link href="/cart">Cart</Link></div>
        <div><h4>Company</h4><span>About Aurora</span><span>Careers</span><span>Privacy</span></div>
      </div>
      <div className="footer-bottom">© 2026 Aurora Commerce. Built with Next.js + MySQL.</div>
    </footer>
  );
}
