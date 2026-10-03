
import PDFDocument from "pdfkit";

type InvoiceItem = {
  product_name: string;
  quantity: number;
  unit_price: number | string;
};

type InvoiceData = {
  orderNumber: string;
  orderDate: Date | string;
  customerName: string;
  customerEmail: string;
  phone?: string | null;
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
  };
  items: InvoiceItem[];
  subtotal: number | string;
  shipping: number | string;
  discount?: number | string;
  total: number | string;
  paymentMethod: string;
  paymentStatus: string;
};

const money = (value: number | string | null | undefined) =>
  `Rs. ${Number(value || 0).toFixed(2)}`;

export function generateInvoice(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 45,
      bufferPages: true,
      info: {
        Title: `Aurora Invoice ${data.orderNumber}`,
        Author: "Aurora Commerce",
      },
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 90;
    const blue = "#23668D";
    const dark = "#203044";
    const muted = "#64748B";

    // Header
    doc.roundedRect(45, 40, contentWidth, 100, 12).fill(blue);

    doc.fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(25)
      .text("AURORA", 62, 58);

    doc.font("Helvetica")
      .fontSize(10)
      .text("Commerce • Order Invoice", 63, 91);

    doc.font("Helvetica-Bold")
      .fontSize(20)
      .text("INVOICE", 365, 59, {
        width: 150,
        align: "right",
      });

    doc.font("Helvetica")
      .fontSize(9)
      .text(data.orderNumber, 350, 91, {
        width: 165,
        align: "right",
      });

    let y = 165;

    // Order information
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(12)
      .text("Invoice Details", 45, y);

    y += 23;

    const formattedDate = new Date(data.orderDate).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

    doc.font("Helvetica").fontSize(10).fillColor(muted);

    doc.text(`Order Number: ${data.orderNumber}`, 45, y);
    doc.text(`Order Date: ${formattedDate}`, 300, y);

    y += 42;

    // Customer and delivery address
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(12)
      .text("Customer Details", 45, y);

    doc.text("Delivery Address", 300, y);

    y += 22;

    doc.font("Helvetica").fontSize(10).fillColor(muted);

    doc.text(data.customerName, 45, y, { width: 220 });
    doc.text(data.address.line1, 300, y, { width: 220 });

    y += 16;

    if (data.customerEmail) {
      doc.text(data.customerEmail, 45, y, { width: 220 });
    }

    if (data.address.line2) {
      doc.text(data.address.line2, 300, y, { width: 220 });
    }

    y += 16;

    if (data.phone) {
      doc.text(`Phone: ${data.phone}`, 45, y, { width: 220 });
    }

    doc.text(
      `${data.address.city}, ${data.address.state} - ${data.address.postalCode}`,
      300,
      y,
      { width: 220 }
    );

    y += 40;

    // Items table
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(12)
      .text("Order Items", 45, y);

    y += 23;

    const columns = {
      product: 45,
      qty: 325,
      price: 385,
      amount: 455,
    };

    const drawTableHeader = () => {
      doc.rect(45, y, contentWidth, 25).fill("#EAF2F8");

      doc.fillColor(dark).font("Helvetica-Bold").fontSize(9);
      doc.text("Product", columns.product + 8, y + 8, { width: 260 });
      doc.text("Qty", columns.qty, y + 8, { width: 35 });
      doc.text("Price", columns.price, y + 8, { width: 65 });
      doc.text("Amount", columns.amount, y + 8, { width: 65 });

      y += 25;
    };

    drawTableHeader();

    for (const item of data.items) {
      const rowHeight = 30;

      if (y + rowHeight > 690) {
        doc.addPage();
        y = 45;
        drawTableHeader();
      }

      const quantity = Number(item.quantity);
      const price = Number(item.unit_price);

      doc.fillColor(dark).font("Helvetica").fontSize(9);

      doc.text(item.product_name, columns.product + 8, y + 9, {
        width: 265,
        ellipsis: true,
      });

      doc.text(String(quantity), columns.qty, y + 9, { width: 35 });
      doc.text(price.toFixed(2), columns.price, y + 9, { width: 65 });
      doc.text((quantity * price).toFixed(2), columns.amount, y + 9, {
        width: 65,
      });

      doc.moveTo(45, y + rowHeight)
        .lineTo(45 + contentWidth, y + rowHeight)
        .strokeColor("#E2E8F0")
        .stroke();

      y += rowHeight;
    }

    // Totals
    y += 25;

    if (y > 650) {
      doc.addPage();
      y = 55;
    }

    const drawTotal = (label: string, value: string, bold = false) => {
      doc.fillColor(bold ? dark : muted)
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(bold ? 12 : 10)
        .text(label, 315, y, { width: 105 });

      doc.text(value, 420, y, {
        width: 95,
        align: "right",
      });

      y += bold ? 24 : 20;
    };

    drawTotal("Subtotal", money(data.subtotal));
    drawTotal("Shipping", money(data.shipping));

    if (Number(data.discount || 0) > 0) {
      drawTotal("Discount", `- ${money(data.discount)}`);
    }

    doc.moveTo(315, y)
      .lineTo(515, y)
      .strokeColor("#CBD5E1")
      .stroke();

    y += 12;

    drawTotal("Grand Total", money(data.total), true);

    // Payment details
    y += 12;

    doc.fillColor(dark).font("Helvetica-Bold").fontSize(11)
      .text("Payment Details", 45, y);

    y += 20;

    doc.fillColor(muted).font("Helvetica").fontSize(10)
      .text(`Method: ${data.paymentMethod}`, 45, y);

    doc.text(`Payment Status: ${data.paymentStatus}`, 250, y);

    // Footer
    const footerY = Math.min(doc.page.height - 55, Math.max(y + 50, 760));

    doc.fillColor(blue).font("Helvetica-Bold").fontSize(10)
      .text("Thank you for shopping with Aurora!", 45, footerY, {
        width: contentWidth,
        align: "center",
      });

    doc.fillColor(muted).font("Helvetica").fontSize(8)
      .text("This invoice was generated electronically.", 45, footerY + 16, {
        width: contentWidth,
        align: "center",
      });

    doc.end();
  });
}