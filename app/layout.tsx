import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

import { StoreProvider } from "@/components/StoreProvider";
import SiteChrome from "@/components/SiteChrome";

export const metadata = {
  title: "Aurora — Premium Commerce",
  description: "A modern premium e-commerce storefront.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <SiteChrome>{children}</SiteChrome>
        </StoreProvider>
      </body>
    </html>
  );
}