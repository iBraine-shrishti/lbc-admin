import ExcelJS from "exceljs";

/**
 * Generates and downloads a beautifully styled Excel workbook containing complete customer records.
 * Includes 2 organized sheets:
 *  1. Customers Directory (Master customer profiles, contact info, orders count, LTV, AOV, tier badges)
 *  2. Customer Analytics (Segment distributions, Top VIP buyers, and Geographic concentration)
 *
 * @param {Array} customers - List of customer objects from API
 * @param {string} filterLabel - Optional label describing active filters (e.g. "All", "Segment: Repeat Buyers")
 */
export const exportCustomersToExcel = async (customers = [], filterLabel = "All Customers") => {
  if (!customers || customers.length === 0) {
    alert("No customer data available to export.");
    return;
  }

  // Filter out internal admin accounts
  const validCustomers = customers.filter(
    (c) =>
      !c.email?.toLowerCase().includes("admin") &&
      c.email?.toLowerCase() !== "admin@lbcmoto.com"
  );

  if (validCustomers.length === 0) {
    alert("No customer records found to export.");
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

  // Tier Style Maps
  const TIER_STYLES = {
    "VIP CUSTOMER": {
      fill: "FFF3E8FF", // Soft Purple
      font: "FF6B21A8", // Deep Purple
    },
    "REPEAT BUYER": {
      fill: "FFDCFCE7", // Soft Green
      font: "FF166534", // Deep Green
    },
    "SINGLE BUYER": {
      fill: "FFDBEAFE", // Soft Blue
      font: "FF1E40AF", // Deep Blue
    },
    "PROSPECT": {
      fill: "FFF1F5F9", // Soft Slate
      font: "FF475569", // Deep Slate
    },
  };

  const getCustomerTier = (ordersCount, totalSpent) => {
    const orders = Number(ordersCount || 0);
    const spent = Number(totalSpent || 0);
    if (spent >= 10000 || orders >= 3) return "VIP CUSTOMER";
    if (orders > 1) return "REPEAT BUYER";
    if (orders === 1) return "SINGLE BUYER";
    return "PROSPECT";
  };

  const thinBorder = {
    top: { style: "thin", color: { argb: BORDER_LIGHT } },
    left: { style: "thin", color: { argb: BORDER_LIGHT } },
    bottom: { style: "thin", color: { argb: BORDER_LIGHT } },
    right: { style: "thin", color: { argb: BORDER_LIGHT } },
  };

  // Helper for applying border to a row
  const applyRowBorder = (row, startCol, endCol, borderStyle = thinBorder) => {
    for (let c = startCol; c <= endCol; c++) {
      row.getCell(c).border = borderStyle;
    }
  };

  // Helper for currency format (Indian Rupees)
  const INR_FORMAT = '"₹" #,##0.00;[Red]("-₹" #,##0.00);"-"';

  // =============================================================
  // SHEET 1: CUSTOMERS DIRECTORY (Master Customer Profiles)
  // =============================================================
  const wsDirectory = workbook.addWorksheet("Customers Directory", {
    properties: { tabColor: { argb: "FF10B981" } }, // Emerald Green Tab
    views: [{ showGridLines: true }],
  });

  // Header Banner
  wsDirectory.mergeCells("A1:M1");
  const title1 = wsDirectory.getCell("A1");
  title1.value = "  LBC MOTO - CUSTOMER DIRECTORY & LIFETIME VALUE REPORT";
  title1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  title1.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  title1.alignment = { vertical: "middle", horizontal: "left" };
  wsDirectory.getRow(1).height = 32;

  wsDirectory.mergeCells("A2:M2");
  const sub1 = wsDirectory.getCell("A2");
  sub1.value = `  Generated on: ${generationTimestamp}  |  Customer Profiles, Contact Details & Lifetime Spend  |  Scope: ${filterLabel}  |  Confidential`;
  sub1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SUB } };
  sub1.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF94A3B8" } };
  sub1.alignment = { vertical: "middle", horizontal: "left" };
  wsDirectory.getRow(2).height = 20;

  // Red Accent Line
  wsDirectory.mergeCells("A3:M3");
  const accent1 = wsDirectory.getCell("A3");
  accent1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_YELLOW } };
  wsDirectory.getRow(3).height = 4;

  // Spacer
  wsDirectory.getRow(4).height = 10;

  // Table Column Definitions
  const directoryColumns = [
    { key: "index", header: "#", width: 6, align: "center" },
    { key: "name", header: "Customer Name", width: 25, align: "left" },
    { key: "email", header: "Email Address", width: 30, align: "left" },
    { key: "phone", header: "Phone Number", width: 17, align: "center" },
    { key: "city", header: "City", width: 18, align: "left" },
    { key: "state", header: "State", width: 18, align: "left" },
    { key: "zip_code", header: "PIN Code", width: 12, align: "center" },
    { key: "address", header: "Delivery Address", width: 35, align: "left" },
    { key: "orders_count", header: "Total Orders", width: 14, align: "right" },
    { key: "total_spent", header: "Lifetime Spend (₹)", width: 20, align: "right" },
    { key: "aov", header: "Avg Order Value (₹)", width: 20, align: "right" },
    { key: "tier", header: "Customer Tier", width: 20, align: "center" },
    { key: "last_order_date", header: "Last Active / Order", width: 20, align: "center" },
  ];

  const headerRow1 = wsDirectory.getRow(5);
  headerRow1.height = 26;
  directoryColumns.forEach((col, idx) => {
    const cell = headerRow1.getCell(idx + 1);
    cell.value = col.header;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
    cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = {
      vertical: "middle",
      horizontal: col.align === "right" ? "right" : col.align === "center" ? "center" : "left",
      wrapText: false,
    };
    cell.border = thinBorder;
  });

  // Populate Customer Rows
  let curRow1 = 6;
  let totalOrdersSum = 0;
  let totalSpentSum = 0;
  let buyersCount = 0;

  validCustomers.forEach((cust, index) => {
    const row = wsDirectory.getRow(curRow1);
    row.height = 22;
    const isOdd = index % 2 === 1;
    const rowBg = isOdd ? ROW_ODD : ROW_EVEN;

    const ordersCount = Number(cust.orders_count || 0);
    const totalSpent = Number(cust.total_spent || 0);
    const aov = ordersCount > 0 ? totalSpent / ordersCount : 0;
    const tier = getCustomerTier(ordersCount, totalSpent);

    totalOrdersSum += ordersCount;
    totalSpentSum += totalSpent;
    if (ordersCount > 0) buyersCount++;

    const fullName = (cust.first_name || cust.name || "").trim() || (cust.email ? cust.email.split("@")[0] : "Guest User");
    const emailVal = cust.email || "N/A";
    const phoneVal = cust.phone ? String(cust.phone).trim() : "-";
    const cityVal = cust.city || (cust.location ? cust.location.split(",")[0]?.trim() : "") || "-";
    const stateVal = cust.state || (cust.location ? cust.location.split(",")[1]?.trim() : "") || "-";
    const zipVal = cust.zip_code ? String(cust.zip_code).trim() : "-";
    const addrVal = cust.address ? String(cust.address).trim() : "-";
    const lastActive = cust.last_order_date || cust.created_at || "-";

    // 1: Index
    const c1 = row.getCell(1);
    c1.value = index + 1;
    c1.alignment = { vertical: "middle", horizontal: "center" };
    c1.font = { name: "Segoe UI", size: 9, color: { argb: "FF64748B" } };

    // 2: Customer Name
    const c2 = row.getCell(2);
    c2.value = fullName;
    c2.alignment = { vertical: "middle", horizontal: "left" };
    c2.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF0F172A" } };

    // 3: Email
    const c3 = row.getCell(3);
    c3.value = emailVal;
    c3.alignment = { vertical: "middle", horizontal: "left" };
    c3.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } };

    // 4: Phone
    const c4 = row.getCell(4);
    c4.value = phoneVal;
    c4.alignment = { vertical: "middle", horizontal: "center" };
    c4.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } };

    // 5: City
    const c5 = row.getCell(5);
    c5.value = cityVal;
    c5.alignment = { vertical: "middle", horizontal: "left" };
    c5.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } };

    // 6: State
    const c6 = row.getCell(6);
    c6.value = stateVal;
    c6.alignment = { vertical: "middle", horizontal: "left" };
    c6.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } };

    // 7: PIN Code
    const c7 = row.getCell(7);
    c7.value = zipVal;
    c7.alignment = { vertical: "middle", horizontal: "center" };
    c7.font = { name: "Segoe UI", size: 9, color: { argb: "FF475569" } };

    // 8: Address
    const c8 = row.getCell(8);
    c8.value = addrVal;
    c8.alignment = { vertical: "middle", horizontal: "left" };
    c8.font = { name: "Segoe UI", size: 8.5, color: { argb: "FF64748B" } };

    // 9: Total Orders
    const c9 = row.getCell(9);
    c9.value = ordersCount;
    c9.numFmt = "#,##0";
    c9.alignment = { vertical: "middle", horizontal: "right" };
    c9.font = { name: "Segoe UI", size: 9, bold: ordersCount > 1, color: { argb: "FF0F172A" } };

    // 10: Lifetime Spend
    const c10 = row.getCell(10);
    c10.value = totalSpent;
    c10.numFmt = INR_FORMAT;
    c10.alignment = { vertical: "middle", horizontal: "right" };
    c10.font = { name: "Segoe UI", size: 9, bold: totalSpent > 0, color: { argb: "FF0F172A" } };

    // 11: AOV
    const c11 = row.getCell(11);
    c11.value = aov;
    c11.numFmt = INR_FORMAT;
    c11.alignment = { vertical: "middle", horizontal: "right" };
    c11.font = { name: "Segoe UI", size: 9, color: { argb: "FF475569" } };

    // 12: Customer Tier
    const c12 = row.getCell(12);
    c12.value = tier;
    c12.alignment = { vertical: "middle", horizontal: "center" };
    const tierStyle = TIER_STYLES[tier] || TIER_STYLES["PROSPECT"];
    c12.fill = { type: "pattern", pattern: "solid", fgColor: { argb: tierStyle.fill } };
    c12.font = { name: "Segoe UI", size: 8, bold: true, color: { argb: tierStyle.font } };

    // 13: Last Order / Active Date
    const c13 = row.getCell(13);
    c13.value = lastActive;
    c13.alignment = { vertical: "middle", horizontal: "center" };
    c13.font = { name: "Segoe UI", size: 8.5, color: { argb: "FF64748B" } };

    // Apply baseline background and borders
    for (let c = 1; c <= 13; c++) {
      if (c !== 12) {
        row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      }
      row.getCell(c).border = thinBorder;
    }

    curRow1++;
  });

  // TOTALS / SUMMARY ROW AT BOTTOM
  const totRow1 = wsDirectory.getRow(curRow1);
  totRow1.height = 28;
  wsDirectory.mergeCells(`A${curRow1}:H${curRow1}`);
  const totLabel1 = totRow1.getCell(1);
  totLabel1.value = `  TOTALS & DIRECTORY METRICS (${validCustomers.length} Customers, ${buyersCount} Active Purchasing Clients)`;
  totLabel1.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: BRAND_DARK } };
  totLabel1.alignment = { vertical: "middle", horizontal: "left" };

  // Total Orders Sum
  const totOrdersCell = totRow1.getCell(9);
  totOrdersCell.value = totalOrdersSum;
  totOrdersCell.numFmt = "#,##0";
  totOrdersCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: BRAND_DARK } };
  totOrdersCell.alignment = { vertical: "middle", horizontal: "right" };

  // Total Spent Sum
  const totSpentCell = totRow1.getCell(10);
  totSpentCell.value = totalSpentSum;
  totSpentCell.numFmt = INR_FORMAT;
  totSpentCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: BRAND_DARK } };
  totSpentCell.alignment = { vertical: "middle", horizontal: "right" };

  // Overall Store AOV
  const overallAOV = totalOrdersSum > 0 ? totalSpentSum / totalOrdersSum : 0;
  const totAovCell = totRow1.getCell(11);
  totAovCell.value = overallAOV;
  totAovCell.numFmt = INR_FORMAT;
  totAovCell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: BRAND_DARK } };
  totAovCell.alignment = { vertical: "middle", horizontal: "right" };

  // Fill and borders for total row
  for (let c = 1; c <= 13; c++) {
    const cell = totRow1.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };
    cell.border = {
      top: { style: "medium", color: { argb: BRAND_DARK } },
      bottom: { style: "double", color: { argb: BRAND_DARK } },
      left: { style: "thin", color: { argb: BORDER_LIGHT } },
      right: { style: "thin", color: { argb: BORDER_LIGHT } },
    };
  }

  // Set Column Widths
  directoryColumns.forEach((col, idx) => {
    wsDirectory.getColumn(idx + 1).width = col.width;
  });


  // =============================================================
  // SHEET 2: CUSTOMER ANALYTICS & INSIGHTS
  // =============================================================
  const wsAnalytics = workbook.addWorksheet("Customer Analytics", {
    properties: { tabColor: { argb: "FF2563EB" } }, // Blue Tab
    views: [{ showGridLines: true }],
  });

  // Header Banner
  wsAnalytics.mergeCells("A1:H1");
  const title2 = wsAnalytics.getCell("A1");
  title2.value = "  LBC MOTO - CUSTOMER SEGMENTATION & REVENUE ANALYTICS";
  title2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  title2.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  title2.alignment = { vertical: "middle", horizontal: "left" };
  wsAnalytics.getRow(1).height = 32;

  wsAnalytics.mergeCells("A2:H2");
  const sub2 = wsAnalytics.getCell("A2");
  sub2.value = `  Generated on: ${generationTimestamp}  |  Segment Breakdown, Top VIP Buyers & Geographic Concentration  |  Confidential`;
  sub2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SUB } };
  sub2.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF94A3B8" } };
  sub2.alignment = { vertical: "middle", horizontal: "left" };
  wsAnalytics.getRow(2).height = 20;

  // Red Accent Line
  wsAnalytics.mergeCells("A3:H3");
  const accent2 = wsAnalytics.getCell("A3");
  accent2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_YELLOW } };
  wsAnalytics.getRow(3).height = 4;

  // -------------------------------------------------------------
  // SECTION 1: SEGMENTATION BREAKDOWN TABLE
  // -------------------------------------------------------------
  wsAnalytics.mergeCells("A5:H5");
  const sec1 = wsAnalytics.getCell("A5");
  sec1.value = "  1. CUSTOMER SEGMENTS & LIFETIME VALUE DISTRIBUTION";
  sec1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SUB } };
  sec1.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  sec1.alignment = { vertical: "middle", horizontal: "left" };
  wsAnalytics.getRow(5).height = 24;

  const segHeaders = [
    { label: "Segment Name", width: 22, align: "left" },
    { label: "Criteria", width: 28, align: "left" },
    { label: "Customer Count", width: 16, align: "right" },
    { label: "% of Base", width: 14, align: "right" },
    { label: "Total Revenue (₹)", width: 20, align: "right" },
    { label: "% of Store Sales", width: 16, align: "right" },
    { label: "Avg LTV / User (₹)", width: 20, align: "right" },
  ];

  const segHeaderRow = wsAnalytics.getRow(6);
  segHeaderRow.height = 24;
  segHeaders.forEach((sh, idx) => {
    const cell = segHeaderRow.getCell(idx + 1);
    cell.value = sh.label;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
    cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: sh.align };
    cell.border = thinBorder;
  });

  // Calculate segment metrics
  const totalBase = validCustomers.length || 1;
  const storeTotalRev = totalSpentSum || 1;

  const segmentsData = [
    {
      name: "VIP Buyers",
      criteria: "Total Spend ≥ ₹10,000 or Orders ≥ 3",
      filter: (c) => Number(c.total_spent || 0) >= 10000 || Number(c.orders_count || 0) >= 3,
      pillColor: "FFF3E8FF",
      pillFont: "FF6B21A8",
    },
    {
      name: "Frequent / Repeat Buyers",
      criteria: "Orders > 1 (excluding VIP)",
      filter: (c) =>
        Number(c.orders_count || 0) > 1 &&
        Number(c.total_spent || 0) < 10000 &&
        Number(c.orders_count || 0) < 3,
      pillColor: "FFDCFCE7",
      pillFont: "FF166534",
    },
    {
      name: "Single-Purchase Buyers",
      criteria: "Orders Placed = 1",
      filter: (c) => Number(c.orders_count || 0) === 1,
      pillColor: "FFDBEAFE",
      pillFont: "FF1E40AF",
    },
    {
      name: "Prospects / Inactive Accounts",
      criteria: "Orders Placed = 0",
      filter: (c) => Number(c.orders_count || 0) === 0,
      pillColor: "FFF1F5F9",
      pillFont: "FF475569",
    },
  ];

  let segRowIdx = 7;
  segmentsData.forEach((seg, sIdx) => {
    const matching = validCustomers.filter(seg.filter);
    const count = matching.length;
    const rev = matching.reduce((acc, c) => acc + Number(c.total_spent || 0), 0);
    const pctBase = (count / totalBase) * 100;
    const pctSales = (rev / storeTotalRev) * 100;
    const avgLtv = count > 0 ? rev / count : 0;

    const row = wsAnalytics.getRow(segRowIdx);
    row.height = 22;
    const rowBg = sIdx % 2 === 1 ? ROW_ODD : ROW_EVEN;

    // Col 1: Name (Pill styled)
    const c1 = row.getCell(1);
    c1.value = seg.name;
    c1.alignment = { vertical: "middle", horizontal: "left" };
    c1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: seg.pillColor } };
    c1.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: seg.pillFont } };

    // Col 2: Criteria
    const c2 = row.getCell(2);
    c2.value = seg.criteria;
    c2.alignment = { vertical: "middle", horizontal: "left" };
    c2.font = { name: "Segoe UI", size: 8.5, color: { argb: "FF475569" } };

    // Col 3: Count
    const c3 = row.getCell(3);
    c3.value = count;
    c3.numFmt = "#,##0";
    c3.alignment = { vertical: "middle", horizontal: "right" };
    c3.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF0F172A" } };

    // Col 4: % of Base
    const c4 = row.getCell(4);
    c4.value = pctBase / 100;
    c4.numFmt = "0.0%";
    c4.alignment = { vertical: "middle", horizontal: "right" };
    c4.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } };

    // Col 5: Total Revenue
    const c5 = row.getCell(5);
    c5.value = rev;
    c5.numFmt = INR_FORMAT;
    c5.alignment = { vertical: "middle", horizontal: "right" };
    c5.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF0F172A" } };

    // Col 6: % of Store Sales
    const c6 = row.getCell(6);
    c6.value = pctSales / 100;
    c6.numFmt = "0.0%";
    c6.alignment = { vertical: "middle", horizontal: "right" };
    c6.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } };

    // Col 7: Avg LTV
    const c7 = row.getCell(7);
    c7.value = avgLtv;
    c7.numFmt = INR_FORMAT;
    c7.alignment = { vertical: "middle", horizontal: "right" };
    c7.font = { name: "Segoe UI", size: 9, color: { argb: "FF0F172A" } };

    for (let c = 1; c <= 7; c++) {
      if (c !== 1) {
        row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      }
      row.getCell(c).border = thinBorder;
    }

    segRowIdx++;
  });

  // -------------------------------------------------------------
  // SECTION 2: TOP 15 HIGH-VALUE VIP CUSTOMERS
  // -------------------------------------------------------------
  segRowIdx += 2;
  wsAnalytics.mergeCells(`A${segRowIdx}:H${segRowIdx}`);
  const sec2 = wsAnalytics.getCell(`A${segRowIdx}`);
  sec2.value = "  2. TOP 15 HIGH-VALUE CLIENTS (RANKED BY LIFETIME SPEND)";
  sec2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SUB } };
  sec2.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  sec2.alignment = { vertical: "middle", horizontal: "left" };
  wsAnalytics.getRow(segRowIdx).height = 24;

  segRowIdx++;
  const vipHeaders = [
    { label: "Rank", width: 8, align: "center" },
    { label: "Customer Name", width: 25, align: "left" },
    { label: "Email Address", width: 28, align: "left" },
    { label: "Phone", width: 16, align: "center" },
    { label: "Location", width: 22, align: "left" },
    { label: "Orders Placed", width: 15, align: "right" },
    { label: "Lifetime Spend (₹)", width: 20, align: "right" },
    { label: "% of Store Sales", width: 16, align: "right" },
  ];

  const vipHeaderRow = wsAnalytics.getRow(segRowIdx);
  vipHeaderRow.height = 24;
  vipHeaders.forEach((vh, idx) => {
    const cell = vipHeaderRow.getCell(idx + 1);
    cell.value = vh.label;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
    cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: vh.align };
    cell.border = thinBorder;
  });

  const sortedBySpend = [...validCustomers]
    .filter((c) => Number(c.total_spent || 0) > 0)
    .sort((a, b) => Number(b.total_spent || 0) - Number(a.total_spent || 0))
    .slice(0, 15);

  segRowIdx++;
  if (sortedBySpend.length === 0) {
    const emptyRow = wsAnalytics.getRow(segRowIdx);
    wsAnalytics.mergeCells(`A${segRowIdx}:H${segRowIdx}`);
    const emptyCell = emptyRow.getCell(1);
    emptyCell.value = "No purchasing customers recorded yet.";
    emptyCell.alignment = { vertical: "middle", horizontal: "center" };
    emptyCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF94A3B8" } };
    applyRowBorder(emptyRow, 1, 8);
    segRowIdx++;
  } else {
    sortedBySpend.forEach((cust, vIdx) => {
      const row = wsAnalytics.getRow(segRowIdx);
      row.height = 22;
      const isOdd = vIdx % 2 === 1;
      const rowBg = isOdd ? ROW_ODD : ROW_EVEN;

      const spent = Number(cust.total_spent || 0);
      const orders = Number(cust.orders_count || 0);
      const pctSales = (spent / storeTotalRev) * 100;
      const custName = (cust.first_name || cust.name || "").trim() || (cust.email ? cust.email.split("@")[0] : "Customer");
      const loc = cust.city && cust.state ? `${cust.city}, ${cust.state}` : (cust.location || "-");

      // Rank
      const c1 = row.getCell(1);
      c1.value = `#${vIdx + 1}`;
      c1.alignment = { vertical: "middle", horizontal: "center" };
      c1.font = { name: "Segoe UI", size: 9, bold: vIdx < 3, color: { argb: vIdx < 3 ? BRAND_YELLOW : "FF64748B" } };

      // Customer Name
      const c2 = row.getCell(2);
      c2.value = custName;
      c2.alignment = { vertical: "middle", horizontal: "left" };
      c2.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF0F172A" } };

      // Email
      const c3 = row.getCell(3);
      c3.value = cust.email || "-";
      c3.alignment = { vertical: "middle", horizontal: "left" };
      c3.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } };

      // Phone
      const c4 = row.getCell(4);
      c4.value = cust.phone ? String(cust.phone).trim() : "-";
      c4.alignment = { vertical: "middle", horizontal: "center" };
      c4.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } };

      // Location
      const c5 = row.getCell(5);
      c5.value = loc;
      c5.alignment = { vertical: "middle", horizontal: "left" };
      c5.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } };

      // Orders Placed
      const c6 = row.getCell(6);
      c6.value = orders;
      c6.numFmt = "#,##0";
      c6.alignment = { vertical: "middle", horizontal: "right" };
      c6.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF0F172A" } };

      // Lifetime Spend
      const c7 = row.getCell(7);
      c7.value = spent;
      c7.numFmt = INR_FORMAT;
      c7.alignment = { vertical: "middle", horizontal: "right" };
      c7.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF166534" } };

      // % of Store Sales
      const c8 = row.getCell(8);
      c8.value = pctSales / 100;
      c8.numFmt = "0.0%";
      c8.alignment = { vertical: "middle", horizontal: "right" };
      c8.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } };

      for (let c = 1; c <= 8; c++) {
        row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
        row.getCell(c).border = thinBorder;
      }

      segRowIdx++;
    });
  }

  // -------------------------------------------------------------
  // SECTION 3: TOP CUSTOMER STATES (GEOGRAPHIC BREAKDOWN)
  // -------------------------------------------------------------
  segRowIdx += 2;
  wsAnalytics.mergeCells(`A${segRowIdx}:E${segRowIdx}`);
  const sec3 = wsAnalytics.getCell(`A${segRowIdx}`);
  sec3.value = "  3. TOP CUSTOMER LOCATIONS (GEOGRAPHIC CONCENTRATION)";
  sec3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SUB } };
  sec3.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  sec3.alignment = { vertical: "middle", horizontal: "left" };
  wsAnalytics.getRow(segRowIdx).height = 24;

  segRowIdx++;
  const geoHeaders = [
    { label: "Rank", width: 8, align: "center" },
    { label: "State / Region", width: 25, align: "left" },
    { label: "Customers", width: 14, align: "right" },
    { label: "Orders Placed", width: 16, align: "right" },
    { label: "Total Revenue (₹)", width: 22, align: "right" },
  ];

  const geoHeaderRow = wsAnalytics.getRow(segRowIdx);
  geoHeaderRow.height = 24;
  geoHeaders.forEach((gh, idx) => {
    const cell = geoHeaderRow.getCell(idx + 1);
    cell.value = gh.label;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
    cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: gh.align };
    cell.border = thinBorder;
  });

  // Aggregate by state
  const stateMap = {};
  validCustomers.forEach((cust) => {
    let state = (cust.state || "").trim();
    if (!state && cust.location && cust.location.includes(",")) {
      state = cust.location.split(",")[1]?.trim();
    }
    if (!state || state.toLowerCase() === "unknown") state = "Unspecified Region";

    if (!stateMap[state]) {
      stateMap[state] = { customers: 0, orders: 0, revenue: 0 };
    }
    stateMap[state].customers += 1;
    stateMap[state].orders += Number(cust.orders_count || 0);
    stateMap[state].revenue += Number(cust.total_spent || 0);
  });

  const sortedStates = Object.entries(stateMap)
    .sort((a, b) => b[1].revenue - a[1].revenue || b[1].customers - a[1].customers)
    .slice(0, 10);

  segRowIdx++;
  sortedStates.forEach(([stName, stData], gIdx) => {
    const row = wsAnalytics.getRow(segRowIdx);
    row.height = 22;
    const isOdd = gIdx % 2 === 1;
    const rowBg = isOdd ? ROW_ODD : ROW_EVEN;

    const c1 = row.getCell(1);
    c1.value = `#${gIdx + 1}`;
    c1.alignment = { vertical: "middle", horizontal: "center" };
    c1.font = { name: "Segoe UI", size: 9, color: { argb: "FF64748B" } };

    const c2 = row.getCell(2);
    c2.value = stName;
    c2.alignment = { vertical: "middle", horizontal: "left" };
    c2.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF0F172A" } };

    const c3 = row.getCell(3);
    c3.value = stData.customers;
    c3.numFmt = "#,##0";
    c3.alignment = { vertical: "middle", horizontal: "right" };
    c3.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } };

    const c4 = row.getCell(4);
    c4.value = stData.orders;
    c4.numFmt = "#,##0";
    c4.alignment = { vertical: "middle", horizontal: "right" };
    c4.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } };

    const c5 = row.getCell(5);
    c5.value = stData.revenue;
    c5.numFmt = INR_FORMAT;
    c5.alignment = { vertical: "middle", horizontal: "right" };
    c5.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF0F172A" } };

    for (let c = 1; c <= 5; c++) {
      row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      row.getCell(c).border = thinBorder;
    }

    segRowIdx++;
  });

  // Set Column Widths for Sheet 2
  const sheet2ColWidths = [10, 28, 30, 18, 24, 18, 22, 18];
  sheet2ColWidths.forEach((w, idx) => {
    wsAnalytics.getColumn(idx + 1).width = w;
  });

  // =============================================================
  // GENERATE AND TRIGGER DOWNLOAD
  // =============================================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileDate = now.toISOString().slice(0, 10);
  const fileTime = now.toTimeString().slice(0, 5).replace(":", "");
  const fileName = `LBC Moto_Customers_${fileDate}_${fileTime}.xlsx`;

  // Standard browser download trigger
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};
