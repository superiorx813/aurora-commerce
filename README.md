# Aurora Commerce

A premium Next.js + MySQL e-commerce starter with a deliberately different visual language from traditional marketplace layouts.

## Included

- Premium responsive storefront
- Search, category filters and sorting
- Product detail pages
- Cart and quantity controls
- Wishlist
- Customer registration/login
- JWT HTTP-only session cookie
- Checkout and MySQL order storage
- Inventory decrement during checkout
- Order history and order detail
- Admin dashboard
- Coupons/banner/category/product database tables
- Bootstrap base utilities + custom CSS
- Framer Motion hover animations
- MySQL seed data

## Demo accounts

Admin: admin@aurora.local / Admin@123
Customer: user@aurora.local / User@123

## Important

Real card/UPI payments, shipping-provider APIs, email/SMS OTP, refunds, seller marketplace workflows, product image upload/storage, and production-grade fraud/rate-limit infrastructure need provider credentials and should be added before production launch. The checkout in this starter deliberately supports demo/COD/UPI/card labels but does not charge real money.

## Run

1. Create MySQL database by importing `database/aurora_store.sql`.
2. Copy `.env.example` to `.env.local` and fill in MySQL credentials and AUTH_SECRET.
3. `npm install`
4. `npm run db:test`
5. `npm run db:seed`
6. `npm run dev`
7. Open http://localhost:3000
