import ExcelJS from "exceljs";

/**
 * Generates and downloads a beautifully styled Excel workbook containing complete orders data.
 * Includes 3 organized sheets:
 *  1. Orders List (Master orders overview with customer, payment, fulfillment, and address details)
 *  2. Order Items Breakdown (Item-by-item breakdown with SKU, variants, quantities, and line totals)
 *  3. Performance Summary (Financials, payment rates, order statuses, and top delivery locations)
 *
 * @param {Array} orders - List of order objects from API
 * @param {string} filterLabel - Optional label describing active filters (e.g. "All", "Paid", "Search: John")
 */
export const exportOrdersToExcel = async (orders = [], filterLabel = "All Orders") => {
  if (!orders || orders.length === 0) {
    alert("No orders data available to export.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LBC Moto Admin";
  workbook.created = new Date();
  workbook.modified = new Date();

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const generationTimestamp = `${dateStr} at ${timeStr}`;

  // Palette Constants matching LBC Moto Admin & Inventory Export
  const BRAND_DARK = "FF0F172A";       // Slate 900
  const BRAND_SUB = "FF1E293B";        // Slate 800
  const BRAND_YELLOW = "FFFECD08";        // LBC Moto Red
  const BORDER_LIGHT = "FFE2E8F0";     // Slate 200
  const ROW_EVEN = "FFFFFFFF";         // White
  const ROW_ODD = "FFF8FAFC";          // Slate 50
  const TOTAL_BG = "FFF1F5F9";         // Slate 100

  // Status Style Maps
  const PAYMENT_STYLES = {
    PAID: {
      fill: "FFDCFCE7", // Soft Green
      font: "FF166534", // Deep Green
    },
    UNPAID: {
      fill: "FFFEE2E2", // Soft Red
      font: "FF991B1B", // Deep Red
    },
  };

  const FULFILLMENT_STYLES = {
    DELIVERED: {
      fill: "FFDCFCE7", // Soft Green
      font: "FF166534", // Deep Green
    },
    SHIPPED: {
      fill: "FFDBEAFE", // Soft Blue
      font: "FF1E40AF", // Deep Blue
    },
    PROCESSING: {
      fill: "FFFEF3C7", // Soft Amber
      font: "FF92400E", // Deep Amber
    },
    PENDING: {
      fill: "FFFEF3C7", // Soft Amber
      font: "FF92400E", // Deep Amber
    },
    CANCELLED: {
      fill: "FFFEE2E2", // Soft Red
      font: "FF991B1B", // Deep Red
    },
  };

  const thinBorder = {
    top: { style: "thin", color: { argb: BORDER_LIGHT } },
    left: { style: "thin", color: { argb: BORDER_LIGHT } },
    bottom: { style: "thin", color: { argb: BORDER_LIGHT } },
    right: { style: "thin", color: { argb: BORDER_LIGHT } },
  };

  const formatOrderDate = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  // =============================================================
  // SHEET 1: ALL ORDERS (Master Overview)
  // =============================================================
  const wsOrders = workbook.addWorksheet("Orders List", {
    properties: { tabColor: { argb: "FFFECD08" } },
    views: [{ showGridLines: true }],
  });

  // Header Banner
  wsOrders.mergeCells("A1:O1");
  const title1 = wsOrders.getCell("A1");
  title1.value = "  LBC MOTO - CUSTOMER ORDERS MASTER EXPORT";
  title1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  title1.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  title1.alignment = { vertical: "middle", horizontal: "left" };
  wsOrders.getRow(1).height = 32;

  wsOrders.mergeCells("A2:O2");
  const sub1 = wsOrders.getCell("A2");
  sub1.value = `  Generated on: ${generationTimestamp}  |  Scope: ${filterLabel} (${orders.length} Orders)  |  Confidential Business Data`;
  sub1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SUB } };
  sub1.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF94A3B8" } };
  sub1.alignment = { vertical: "middle", horizontal: "left" };
  wsOrders.getRow(2).height = 20;

  wsOrders.getRow(3).height = 8; // Spacer

  // Column definitions for Sheet 1
  const orderColumns = [
    { header: "Order ID", key: "id", width: 14, align: "center" },
    { header: "Order Date", key: "date", width: 16, align: "center" },
    { header: "Customer Name", key: "name", width: 26, align: "left" },
    { header: "Email Address", key: "email", width: 28, align: "left" },
    { header: "Phone Number", key: "phone", width: 18, align: "center" },
    { header: "Delivery City", key: "city", width: 18, align: "left" },
    { header: "State", key: "state", width: 18, align: "left" },
    { header: "Pincode", key: "pincode", width: 12, align: "center" },
    { header: "Shipping Address", key: "address", width: 36, align: "left" },
    { header: "Payment Status", key: "payment", width: 16, align: "center" },
    { header: "Fulfillment Status", key: "status", width: 20, align: "center" },
    { header: "Items Qty", key: "itemsCount", width: 12, align: "center" },
    { header: "Purchased Items Summary", key: "itemsSummary", width: 42, align: "left" },
    { header: "Order Total (₹)", key: "total", width: 18, align: "right" },
    { header: "Custom Note", key: "note", width: 30, align: "left" },
  ];

  // Set Row 4 Headers
  const headerRow1 = wsOrders.getRow(4);
  headerRow1.height = 26;
  orderColumns.forEach((col, idx) => {
    const cell = headerRow1.getCell(idx + 1);
    cell.value = col.header;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_YELLOW } };
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: col.align };
    cell.border = thinBorder;
  });

  let currentRowIdx1 = 5;
  let grandTotalRevenue = 0;
  let grandTotalItems = 0;

  orders.forEach((order) => {
    const isPaid = !!order.is_paid;
    const fulfillmentStatus = (order.status || "Processing").toUpperCase();
    const orderTotal = parseFloat(order.total_price || 0);

    const items = Array.isArray(order.items) ? order.items : [];
    let orderItemsQty = 0;
    const itemNames = [];

    items.forEach((it) => {
      const q = parseInt(it.quantity || 1, 10);
      orderItemsQty += q;
      const title = it.product?.title || it.product_title || "Item";
      const variant = it.color || it.size ? ` (${[it.color, it.size].filter(Boolean).join(", ")})` : "";
      itemNames.push(`${title}${variant} x ${q}`);
    });

    const itemsSummary = itemNames.length > 0 ? itemNames.join("; ") : "N/A";
    grandTotalRevenue += orderTotal;
    grandTotalItems += orderItemsQty;

    const row = wsOrders.getRow(currentRowIdx1);
    row.height = 24;
    const rowBg = currentRowIdx1 % 2 === 0 ? ROW_EVEN : ROW_ODD;

    const values = [
      `#${order.id}`,
      formatOrderDate(order.created_at),
      (order.full_name || "Valued Rider").toUpperCase(),
      order.email || "N/A",
      order.phone || "N/A",
      order.city || "N/A",
      order.state || "N/A",
      order.zip_code || "N/A",
      order.address || "N/A",
      isPaid ? "PAID" : "UNPAID",
      fulfillmentStatus,
      orderItemsQty,
      itemsSummary,
      orderTotal,
      order.custom_note || "-",
    ];

    values.forEach((val, idx) => {
      const cell = row.getCell(idx + 1);
      cell.value = val;
      cell.border = thinBorder;
      cell.font = { name: "Segoe UI", size: 9.5 };
      cell.alignment = {
        vertical: "middle",
        horizontal: orderColumns[idx].align,
        wrapText: idx === 12 || idx === 8, // wrap purchased items and address
      };

      // Zebra striping background default
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };

      // Bold order ID with red branding accent
      if (idx === 0) {
        cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: BRAND_YELLOW } };
      }

      // Customer name bold
      if (idx === 2) {
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: BRAND_DARK } };
      }

      // Currency formatting
      if (idx === 13) {
        cell.numFmt = "₹ #,##0.00";
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF0F172A" } };
      }

      // Payment Status Badge
      if (idx === 9) {
        const style = isPaid ? PAYMENT_STYLES.PAID : PAYMENT_STYLES.UNPAID;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: style.fill } };
        cell.font = { name: "Segoe UI", size: 8.5, bold: true, color: { argb: style.font } };
      }

      // Fulfillment Status Badge
      if (idx === 10) {
        const style = FULFILLMENT_STYLES[fulfillmentStatus] || FULFILLMENT_STYLES.PROCESSING;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: style.fill } };
        cell.font = { name: "Segoe UI", size: 8.5, bold: true, color: { argb: style.font } };
      }

      // Custom Note highlighted if present
      if (idx === 14 && val && val !== "-") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } }; // Soft light yellow
        cell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF854D0E" } };
      }
    });

    currentRowIdx1++;
  });

  // Sheet 1 Total Summary Row
  const totalRow1 = wsOrders.getRow(currentRowIdx1);
  totalRow1.height = 28;
  wsOrders.mergeCells(`A${currentRowIdx1}:K${currentRowIdx1}`);
  const totalLabel1 = totalRow1.getCell(1);
  totalLabel1.value = `TOTAL (${orders.length} ORDERS)`;
  totalLabel1.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: BRAND_DARK } };
  totalLabel1.alignment = { vertical: "middle", horizontal: "right" };
  totalLabel1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };

  // Total items cell
  const totalItemsCell = totalRow1.getCell(12);
  totalItemsCell.value = grandTotalItems;
  totalItemsCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: BRAND_DARK } };
  totalItemsCell.alignment = { vertical: "middle", horizontal: "center" };
  totalItemsCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };

  // Total summary cell spacer
  const totalSummarySpacer = totalRow1.getCell(13);
  totalSummarySpacer.value = "";
  totalSummarySpacer.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };

  // Total revenue cell
  const totalRevenueCell = totalRow1.getCell(14);
  totalRevenueCell.value = grandTotalRevenue;
  totalRevenueCell.numFmt = "₹ #,##0.00";
  totalRevenueCell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: BRAND_YELLOW } };
  totalRevenueCell.alignment = { vertical: "middle", horizontal: "right" };
  totalRevenueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };

  // Note spacer cell
  const noteSpacer = totalRow1.getCell(15);
  noteSpacer.value = "";
  noteSpacer.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };

  for (let c = 1; c <= 15; c++) {
    totalRow1.getCell(c).border = {
      top: { style: "medium", color: { argb: BRAND_YELLOW } },
      bottom: { style: "double", color: { argb: BRAND_DARK } },
    };
  }

  // Set explicit column widths
  orderColumns.forEach((col, idx) => {
    wsOrders.getColumn(idx + 1).width = col.width;
  });


  // =============================================================
  // SHEET 2: ORDER LINE ITEMS (Packaging & Item-Level Breakdown)
  // =============================================================
  const wsItems = workbook.addWorksheet("Order Items Breakdown", {
    properties: { tabColor: { argb: "FF3B82F6" } },
    views: [{ showGridLines: true }],
  });

  // Header Banner
  wsItems.mergeCells("A1:N1");
  const title2 = wsItems.getCell("A1");
  title2.value = "  LBC MOTO - ORDER LINE ITEMS & VARIANT FULFILLMENT BREAKDOWN";
  title2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  title2.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  title2.alignment = { vertical: "middle", horizontal: "left" };
  wsItems.getRow(1).height = 32;

  wsItems.mergeCells("A2:N2");
  const sub2 = wsItems.getCell("A2");
  sub2.value = `  Generated on: ${generationTimestamp}  |  Warehouse Picking, Variant Quantities & Packing List  |  Confidential`;
  sub2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SUB } };
  sub2.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF94A3B8" } };
  sub2.alignment = { vertical: "middle", horizontal: "left" };
  wsItems.getRow(2).height = 20;

  wsItems.getRow(3).height = 8; // Spacer

  const itemColumns = [
    { header: "Order ID", key: "orderId", width: 14, align: "center" },
    { header: "Order Date", key: "orderDate", width: 16, align: "center" },
    { header: "Customer Name", key: "customerName", width: 24, align: "left" },
    { header: "Customer Phone", key: "customerPhone", width: 18, align: "center" },
    { header: "Destination City", key: "city", width: 18, align: "left" },
    { header: "Pincode", key: "pincode", width: 12, align: "center" },
    { header: "Item SKU", key: "sku", width: 18, align: "center" },
    { header: "Product Title", key: "productTitle", width: 38, align: "left" },
    { header: "Variant / Color", key: "variant", width: 22, align: "left" },
    { header: "Size / Spec", key: "size", width: 14, align: "center" },
    { header: "Qty", key: "quantity", width: 10, align: "center" },
    { header: "Unit Price (₹)", key: "unitPrice", width: 16, align: "right" },
    { header: "Line Total (₹)", key: "lineTotal", width: 18, align: "right" },
    { header: "Fulfillment Status", key: "status", width: 18, align: "center" },
  ];

  const headerRow2 = wsItems.getRow(4);
  headerRow2.height = 26;
  itemColumns.forEach((col, idx) => {
    const cell = headerRow2.getCell(idx + 1);
    cell.value = col.header;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }; // Slate 800
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: col.align };
    cell.border = thinBorder;
  });

  let currentRowIdx2 = 5;
  let totalLineItemQty = 0;
  let totalLineItemRevenue = 0;

  orders.forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const fulfillmentStatus = (order.status || "Processing").toUpperCase();

    items.forEach((it) => {
      const q = parseInt(it.quantity || 1, 10);
      const unitPrice = parseFloat(it.price || 0);
      const lineTotal = unitPrice * q;

      totalLineItemQty += q;
      totalLineItemRevenue += lineTotal;

      const row = wsItems.getRow(currentRowIdx2);
      row.height = 22;
      const rowBg = currentRowIdx2 % 2 === 0 ? ROW_EVEN : ROW_ODD;

      const values = [
        `#${order.id}`,
        formatOrderDate(order.created_at),
        (order.full_name || "Valued Rider").toUpperCase(),
        order.phone || "N/A",
        order.city || "N/A",
        order.zip_code || "N/A",
        it.sku || it.product?.sku || `ME-${it.product?.id || order.id}`,
        it.product?.title || it.product_title || "Product Item",
        it.color || "Standard",
        it.size || "-",
        q,
        unitPrice,
        lineTotal,
        fulfillmentStatus,
      ];

      values.forEach((val, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = val;
        cell.border = thinBorder;
        cell.font = { name: "Segoe UI", size: 9.5 };
        cell.alignment = { vertical: "middle", horizontal: itemColumns[idx].align };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };

        if (idx === 0) {
          cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: BRAND_YELLOW } };
        }
        if (idx === 10) {
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: BRAND_DARK } };
        }
        if (idx === 11 || idx === 12) {
          cell.numFmt = "₹ #,##0.00";
          if (idx === 12) {
            cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: BRAND_DARK } };
          }
        }
        if (idx === 13) {
          const style = FULFILLMENT_STYLES[fulfillmentStatus] || FULFILLMENT_STYLES.PROCESSING;
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: style.fill } };
          cell.font = { name: "Segoe UI", size: 8.5, bold: true, color: { argb: style.font } };
        }
      });

      currentRowIdx2++;
    });
  });

  // Sheet 2 Total Row
  const totalRow2 = wsItems.getRow(currentRowIdx2);
  totalRow2.height = 28;
  wsItems.mergeCells(`A${currentRowIdx2}:J${currentRowIdx2}`);
  const totalLabel2 = totalRow2.getCell(1);
  totalLabel2.value = "TOTAL LINE ITEMS SUMMARY";
  totalLabel2.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: BRAND_DARK } };
  totalLabel2.alignment = { vertical: "middle", horizontal: "right" };
  totalLabel2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };

  const totalQtyCell2 = totalRow2.getCell(11);
  totalQtyCell2.value = totalLineItemQty;
  totalQtyCell2.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: BRAND_DARK } };
  totalQtyCell2.alignment = { vertical: "middle", horizontal: "center" };
  totalQtyCell2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };

  const totalUnitPriceSpacer2 = totalRow2.getCell(12);
  totalUnitPriceSpacer2.value = "";
  totalUnitPriceSpacer2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };

  const totalRevCell2 = totalRow2.getCell(13);
  totalRevCell2.value = totalLineItemRevenue;
  totalRevCell2.numFmt = "₹ #,##0.00";
  totalRevCell2.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: BRAND_YELLOW } };
  totalRevCell2.alignment = { vertical: "middle", horizontal: "right" };
  totalRevCell2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };

  const statusSpacer2 = totalRow2.getCell(14);
  statusSpacer2.value = "";
  statusSpacer2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };

  for (let c = 1; c <= 14; c++) {
    totalRow2.getCell(c).border = {
      top: { style: "medium", color: { argb: BRAND_YELLOW } },
      bottom: { style: "double", color: { argb: BRAND_DARK } },
    };
  }

  itemColumns.forEach((col, idx) => {
    wsItems.getColumn(idx + 1).width = col.width;
  });


  // =============================================================
  // SHEET 3: ORDERS SUMMARY & FINANCIAL METRICS
  // =============================================================
  const wsSummary = workbook.addWorksheet("Performance Summary", {
    properties: { tabColor: { argb: "FF10B981" } },
    views: [{ showGridLines: true }],
  });

  wsSummary.mergeCells("A1:G1");
  const title3 = wsSummary.getCell("A1");
  title3.value = "  LBC MOTO - ORDERS & FINANCIAL PERFORMANCE SUMMARY";
  title3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  title3.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  title3.alignment = { vertical: "middle", horizontal: "left" };
  wsSummary.getRow(1).height = 32;

  wsSummary.mergeCells("A2:G2");
  const sub3 = wsSummary.getCell("A2");
  sub3.value = `  Generated on: ${generationTimestamp}  |  Financial Metrics, Payment Breakdown & Geographic Overview`;
  sub3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SUB } };
  sub3.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF94A3B8" } };
  sub3.alignment = { vertical: "middle", horizontal: "left" };
  wsSummary.getRow(2).height = 20;

  wsSummary.getRow(3).height = 14; // Spacer

  // Calculate statistics
  let paidOrdersCount = 0;
  let paidRevenue = 0;
  let unpaidOrdersCount = 0;
  let unpaidRevenue = 0;
  const statusCounts = {};
  const cityCounts = {};
  const stateCounts = {};

  orders.forEach((o) => {
    const isPaid = !!o.is_paid;
    const rev = parseFloat(o.total_price || 0);
    const st = (o.status || "Processing").toUpperCase();

    if (isPaid) {
      paidOrdersCount++;
      paidRevenue += rev;
    } else {
      unpaidOrdersCount++;
      unpaidRevenue += rev;
    }

    statusCounts[st] = (statusCounts[st] || 0) + 1;

    if (o.city) {
      const city = o.city.trim().toUpperCase();
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    }
    if (o.state) {
      const state = o.state.trim().toUpperCase();
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    }
  });

  const avgOrderValue = orders.length > 0 ? grandTotalRevenue / orders.length : 0;
  const paymentRate = orders.length > 0 ? ((paidOrdersCount / orders.length) * 100).toFixed(1) : 0;

  // Key KPI Cards Table
  wsSummary.mergeCells("A4:C4");
  const kpiHeader = wsSummary.getCell("A4");
  kpiHeader.value = "  EXECUTIVE FINANCIAL METRICS";
  kpiHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_YELLOW } };
  kpiHeader.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  kpiHeader.alignment = { vertical: "middle", horizontal: "left" };
  wsSummary.getRow(4).height = 24;

  const kpis = [
    ["Total Orders Processed", orders.length, "Count"],
    ["Total Gross Revenue", grandTotalRevenue, "Currency"],
    ["Paid Orders Count", `${paidOrdersCount} (${paymentRate}%)`, "String"],
    ["Total Collected (Paid)", paidRevenue, "Currency"],
    ["Unpaid / Pending Orders", unpaidOrdersCount, "Count"],
    ["Unpaid Balance", unpaidRevenue, "Currency"],
    ["Average Order Value (AOV)", avgOrderValue, "Currency"],
    ["Total Units Sold", grandTotalItems, "Count"],
  ];

  let kpiRowIdx = 5;
  kpis.forEach(([label, value, type]) => {
    const r = wsSummary.getRow(kpiRowIdx);
    r.height = 22;
    const bg = kpiRowIdx % 2 === 0 ? ROW_EVEN : ROW_ODD;

    wsSummary.mergeCells(`A${kpiRowIdx}:B${kpiRowIdx}`);
    const lCell = r.getCell(1);
    lCell.value = `  ${label}`;
    lCell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: BRAND_DARK } };
    lCell.alignment = { vertical: "middle", horizontal: "left" };
    lCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    lCell.border = thinBorder;
    r.getCell(2).border = thinBorder;

    const vCell = r.getCell(3);
    vCell.value = value;
    vCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: type === "Currency" ? BRAND_YELLOW : BRAND_DARK } };
    vCell.alignment = { vertical: "middle", horizontal: type === "Currency" ? "right" : "center" };
    vCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    vCell.border = thinBorder;
    if (type === "Currency") vCell.numFmt = "₹ #,##0.00";

    kpiRowIdx++;
  });

  // Fulfillment Breakdown Table (Column E to G)
  wsSummary.mergeCells("E4:G4");
  const fulfillHeader = wsSummary.getCell("E4");
  fulfillHeader.value = "  FULFILLMENT BREAKDOWN";
  fulfillHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SUB } };
  fulfillHeader.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  fulfillHeader.alignment = { vertical: "middle", horizontal: "left" };

  let fRowIdx = 5;
  Object.entries(statusCounts).forEach(([st, cnt]) => {
    const r = wsSummary.getRow(fRowIdx);
    r.height = 22;
    const bg = fRowIdx % 2 === 0 ? ROW_EVEN : ROW_ODD;

    wsSummary.mergeCells(`E${fRowIdx}:F${fRowIdx}`);
    const lCell = r.getCell(5);
    lCell.value = `  ${st}`;
    lCell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: BRAND_DARK } };
    lCell.alignment = { vertical: "middle", horizontal: "left" };
    lCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    lCell.border = thinBorder;
    r.getCell(6).border = thinBorder;

    const style = FULFILLMENT_STYLES[st] || FULFILLMENT_STYLES.PROCESSING;
    const vCell = r.getCell(7);
    vCell.value = `${cnt} (${((cnt / orders.length) * 100).toFixed(1)}%)`;
    vCell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: style.font } };
    vCell.alignment = { vertical: "middle", horizontal: "center" };
    vCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: style.fill } };
    vCell.border = thinBorder;

    fRowIdx++;
  });

  // Top Delivery Destinations Table
  const geoStartRow = Math.max(kpiRowIdx, fRowIdx) + 2;
  wsSummary.mergeCells(`A${geoStartRow}:C${geoStartRow}`);
  const geoHeader1 = wsSummary.getCell(`A${geoStartRow}`);
  geoHeader1.value = "  TOP DESTINATION STATES";
  geoHeader1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_YELLOW } };
  geoHeader1.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  geoHeader1.alignment = { vertical: "middle", horizontal: "left" };
  wsSummary.getRow(geoStartRow).height = 24;

  wsSummary.mergeCells(`E${geoStartRow}:G${geoStartRow}`);
  const geoHeader2 = wsSummary.getCell(`E${geoStartRow}`);
  geoHeader2.value = "  TOP DESTINATION CITIES";
  geoHeader2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SUB } };
  geoHeader2.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  geoHeader2.alignment = { vertical: "middle", horizontal: "left" };

  const topStates = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxGeoRows = Math.max(topStates.length, topCities.length);
  for (let i = 0; i < maxGeoRows; i++) {
    const rowIdx = geoStartRow + 1 + i;
    const r = wsSummary.getRow(rowIdx);
    r.height = 22;
    const bg = rowIdx % 2 === 0 ? ROW_EVEN : ROW_ODD;

    // State side
    if (topStates[i]) {
      const [stName, stCount] = topStates[i];
      wsSummary.mergeCells(`A${rowIdx}:B${rowIdx}`);
      const lCell = r.getCell(1);
      lCell.value = `  ${i + 1}. ${stName}`;
      lCell.font = { name: "Segoe UI", size: 9.5, bold: false, color: { argb: BRAND_DARK } };
      lCell.alignment = { vertical: "middle", horizontal: "left" };
      lCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      lCell.border = thinBorder;
      r.getCell(2).border = thinBorder;

      const vCell = r.getCell(3);
      vCell.value = `${stCount} orders`;
      vCell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: BRAND_DARK } };
      vCell.alignment = { vertical: "middle", horizontal: "center" };
      vCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      vCell.border = thinBorder;
    }

    // City side
    if (topCities[i]) {
      const [ctName, ctCount] = topCities[i];
      wsSummary.mergeCells(`E${rowIdx}:F${rowIdx}`);
      const lCell = r.getCell(5);
      lCell.value = `  ${i + 1}. ${ctName}`;
      lCell.font = { name: "Segoe UI", size: 9.5, bold: false, color: { argb: BRAND_DARK } };
      lCell.alignment = { vertical: "middle", horizontal: "left" };
      lCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      lCell.border = thinBorder;
      r.getCell(6).border = thinBorder;

      const vCell = r.getCell(7);
      vCell.value = `${ctCount} orders`;
      vCell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: BRAND_DARK } };
      vCell.alignment = { vertical: "middle", horizontal: "center" };
      vCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      vCell.border = thinBorder;
    }
  }

  // Summary sheet column widths
  wsSummary.getColumn(1).width = 22;
  wsSummary.getColumn(2).width = 16;
  wsSummary.getColumn(3).width = 20;
  wsSummary.getColumn(4).width = 6;  // Spacer column
  wsSummary.getColumn(5).width = 22;
  wsSummary.getColumn(6).width = 16;
  wsSummary.getColumn(7).width = 20;


  // =============================================================
  // TRIGGER BROWSER DOWNLOAD
  // =============================================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileDate = now.toISOString().slice(0, 10);
  a.download = `LBC Moto_Orders_${fileDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
