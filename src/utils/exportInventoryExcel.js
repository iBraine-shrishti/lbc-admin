import ExcelJS from "exceljs";

/**
 * Generates and downloads a beautifully styled Excel workbook containing complete inventory data.
 * Includes 3 organized sheets:
 *  1. Master Inventory (Detailed variant-level & standalone item stock)
 *  2. Products Overview (Catalog overview with variant breakdowns)
 *  3. Stock Alerts (Immediate action checklist for Out-of-Stock and Low-Stock items)
 *
 * @param {Array} products - List of product objects from API
 */
export const exportInventoryToExcel = async (products = []) => {
  if (!products || products.length === 0) {
    alert("No inventory data available to export.");
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

  // Palette Constants
  const BRAND_DARK = "FF0F172A";       // Slate 900
  const BRAND_SUB = "FF1E293B";        // Slate 800
  const BRAND_YELLOW = "FFFECD08";        // LBC Moto Red
  const BORDER_LIGHT = "FFE2E8F0";     // Slate 200
  const ROW_EVEN = "FFFFFFFF";         // White
  const ROW_ODD = "FFF8FAFC";          // Slate 50
  const TOTAL_BG = "FFF1F5F9";         // Slate 100

  // Status Style Maps
  const STATUS_STYLES = {
    "OUT OF STOCK": {
      fill: "FFFEE2E2", // Soft Red
      font: "FF991B1B", // Deep Red
    },
    "LOW STOCK": {
      fill: "FFFEF3C7", // Soft Amber
      font: "FF92400E", // Deep Amber
    },
    "IN STOCK": {
      fill: "FFDCFCE7", // Soft Green
      font: "FF166534", // Deep Green
    },
  };

  const thinBorder = {
    top: { style: "thin", color: { argb: BORDER_LIGHT } },
    left: { style: "thin", color: { argb: BORDER_LIGHT } },
    bottom: { style: "thin", color: { argb: BORDER_LIGHT } },
    right: { style: "thin", color: { argb: BORDER_LIGHT } },
  };

  const getStockStatus = (qty) => {
    const q = parseInt(qty, 10) || 0;
    if (q === 0) return "OUT OF STOCK";
    if (q <= 5) return "LOW STOCK";
    return "IN STOCK";
  };

  // -------------------------------------------------------------
  // SHEET 1: MASTER INVENTORY (Variant & Standalone Item Details)
  // -------------------------------------------------------------
  const wsMaster = workbook.addWorksheet("Master Inventory", {
    properties: { tabColor: { argb: "FF16A34A" } },
    views: [{ showGridLines: true }],
  });

  // Calculate high-level stats
  let totalVariantRows = 0;
  let totalMasterUnits = 0;

  // Header Banner
  wsMaster.mergeCells("A1:J1");
  const title1 = wsMaster.getCell("A1");
  title1.value = "  LBC MOTO - MASTER PRODUCT & VARIANT INVENTORY";
  title1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  title1.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  title1.alignment = { vertical: "middle", horizontal: "left" };
  wsMaster.getRow(1).height = 32;

  wsMaster.mergeCells("A2:J2");
  const sub1 = wsMaster.getCell("A2");
  sub1.value = `  Generated on: ${generationTimestamp}  |  Complete Item-Level Breakdown Including Variants  |  Confidential`;
  sub1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SUB } };
  sub1.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF94A3B8" } };
  sub1.alignment = { vertical: "middle", horizontal: "left" };
  wsMaster.getRow(2).height = 20;

  wsMaster.getRow(3).height = 8; // Spacer

  // Column definitions
  const masterColumns = [
    { header: "Product ID", key: "productId", width: 14, align: "center" },
    { header: "Item Type", key: "itemType", width: 18, align: "center" },
    { header: "Product Name", key: "productName", width: 44, align: "left" },
    { header: "Variant / Option", key: "variantName", width: 28, align: "left" },
    { header: "SKU", key: "sku", width: 20, align: "center" },
    { header: "Category", key: "category", width: 20, align: "center" },
    { header: "Price (₹)", key: "price", width: 16, align: "right" },
    { header: "Stock Qty", key: "stockQty", width: 14, align: "center" },
    { header: "Stock Status", key: "status", width: 18, align: "center" },
    { header: "Product Slug / Path", key: "slug", width: 34, align: "left" },
  ];

  // Set row 4 headers
  const headerRow1 = wsMaster.getRow(4);
  headerRow1.height = 26;
  masterColumns.forEach((col, idx) => {
    const cell = headerRow1.getCell(idx + 1);
    cell.value = col.header;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_YELLOW } };
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: col.align };
    cell.border = thinBorder;
  });

  let currentRowIdx1 = 5;

  products.forEach((p) => {
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;

    if (hasVariants) {
      p.variants.forEach((v) => {
        const vStock = parseInt(v.stock_quantity ?? 0, 10);
        const vPrice = parseFloat(v.price || p.price || 0);
        const vSku = v.sku || p.sku || "N/A";
        const vTitle = v.color || "Standard Variant";
        const status = getStockStatus(vStock);

        totalVariantRows++;
        totalMasterUnits += vStock;

        const row = wsMaster.getRow(currentRowIdx1);
        row.height = 22;
        const rowBg = currentRowIdx1 % 2 === 0 ? ROW_EVEN : ROW_ODD;

        row.values = [
          p.id,
          "Variant Item",
          p.title,
          vTitle,
          vSku,
          p.category || "Accessories",
          vPrice,
          vStock,
          status,
          p.slug ? `/${p.slug}` : "—",
        ];

        // Format each cell
        masterColumns.forEach((col, colIdx) => {
          const cell = row.getCell(colIdx + 1);
          cell.border = thinBorder;
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
          cell.font = { name: "Segoe UI", size: 9.5 };
          cell.alignment = { vertical: "middle", horizontal: col.align };

          if (col.key === "price") {
            cell.numFmt = '"₹"#,##0.00';
          }
          if (col.key === "stockQty") {
            cell.numFmt = '#,##0';
            cell.font = { name: "Segoe UI", size: 9.5, bold: true };
          }
          if (col.key === "itemType") {
            cell.font = { name: "Segoe UI", size: 8.5, bold: true, color: { argb: "FF2563EB" } }; // Blue tag
          }
          if (col.key === "status") {
            const st = STATUS_STYLES[status];
            if (st) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: st.fill } };
              cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: st.font } };
            }
          }
        });

        currentRowIdx1++;
      });
    } else {
      // Standalone product
      const pStock = parseInt(p.stock_quantity ?? 0, 10);
      const pPrice = parseFloat(p.price || 0);
      const pSku = p.sku || "N/A";
      const status = getStockStatus(pStock);

      totalMasterUnits += pStock;

      const row = wsMaster.getRow(currentRowIdx1);
      row.height = 22;
      const rowBg = currentRowIdx1 % 2 === 0 ? ROW_EVEN : ROW_ODD;

      row.values = [
        p.id,
        "Standard Product",
        p.title,
        p.color ? p.color : "—",
        pSku,
        p.category || "Accessories",
        pPrice,
        pStock,
        status,
        p.slug ? `/${p.slug}` : "—",
      ];

      masterColumns.forEach((col, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.border = thinBorder;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
        cell.font = { name: "Segoe UI", size: 9.5 };
        cell.alignment = { vertical: "middle", horizontal: col.align };

        if (col.key === "price") {
          cell.numFmt = '"₹"#,##0.00';
        }
        if (col.key === "stockQty") {
          cell.numFmt = '#,##0';
          cell.font = { name: "Segoe UI", size: 9.5, bold: true };
        }
        if (col.key === "itemType") {
          cell.font = { name: "Segoe UI", size: 8.5, bold: true, color: { argb: "FF64748B" } }; // Slate tag
        }
        if (col.key === "status") {
          const st = STATUS_STYLES[status];
          if (st) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: st.fill } };
            cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: st.font } };
          }
        }
      });

      currentRowIdx1++;
    }
  });

  // Summary Row for Sheet 1
  const totalRow1 = wsMaster.getRow(currentRowIdx1);
  totalRow1.height = 26;
  wsMaster.mergeCells(`A${currentRowIdx1}:F${currentRowIdx1}`);
  const totalLabel1 = totalRow1.getCell(1);
  totalLabel1.value = `TOTAL ITEMS: ${currentRowIdx1 - 5} (${products.length} Products, ${totalVariantRows} Variants)`;
  totalLabel1.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: BRAND_DARK } };
  totalLabel1.alignment = { vertical: "middle", horizontal: "right" };
  totalLabel1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };

  // Set borders for merged range
  for (let c = 1; c <= 6; c++) {
    totalRow1.getCell(c).border = {
      top: { style: "medium", color: { argb: "FF94A3B8" } },
      bottom: { style: "double", color: { argb: "FF475569" } },
    };
  }

  const totalPriceCell = totalRow1.getCell(7);
  totalPriceCell.value = "";
  totalPriceCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };
  totalPriceCell.border = {
    top: { style: "medium", color: { argb: "FF94A3B8" } },
    bottom: { style: "double", color: { argb: "FF475569" } },
  };

  const totalQtyCell = totalRow1.getCell(8);
  totalQtyCell.value = totalMasterUnits;
  totalQtyCell.numFmt = '#,##0';
  totalQtyCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: BRAND_YELLOW } };
  totalQtyCell.alignment = { vertical: "middle", horizontal: "center" };
  totalQtyCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };
  totalQtyCell.border = {
    top: { style: "medium", color: { argb: "FF94A3B8" } },
    bottom: { style: "double", color: { argb: "FF475569" } },
  };

  for (let c = 9; c <= 10; c++) {
    const emptyCell = totalRow1.getCell(c);
    emptyCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };
    emptyCell.border = {
      top: { style: "medium", color: { argb: "FF94A3B8" } },
      bottom: { style: "double", color: { argb: "FF475569" } },
    };
  }

  // Set Column Widths
  masterColumns.forEach((col, idx) => {
    wsMaster.getColumn(idx + 1).width = col.width;
  });


  // -------------------------------------------------------------
  // SHEET 2: PRODUCTS OVERVIEW (Catalog & Variant Summary)
  // -------------------------------------------------------------
  const wsOverview = workbook.addWorksheet("Products Overview", {
    properties: { tabColor: { argb: "FF2563EB" } },
    views: [{ showGridLines: true }],
  });

  // Header Banner
  wsOverview.mergeCells("A1:I1");
  const title2 = wsOverview.getCell("A1");
  title2.value = "  LBC MOTO - PRODUCT CATALOG & VARIANT SUMMARY";
  title2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  title2.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  title2.alignment = { vertical: "middle", horizontal: "left" };
  wsOverview.getRow(1).height = 32;

  wsOverview.mergeCells("A2:I2");
  const sub2 = wsOverview.getCell("A2");
  sub2.value = `  Generated on: ${generationTimestamp}  |  Total Products: ${products.length}  |  LBC Moto Inventory Management`;
  sub2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SUB } };
  sub2.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF94A3B8" } };
  sub2.alignment = { vertical: "middle", horizontal: "left" };
  wsOverview.getRow(2).height = 20;

  wsOverview.getRow(3).height = 8; // Spacer

  const overviewColumns = [
    { header: "Product ID", key: "id", width: 14, align: "center" },
    { header: "Product Name", key: "title", width: 44, align: "left" },
    { header: "Category", key: "category", width: 20, align: "center" },
    { header: "Base SKU", key: "sku", width: 20, align: "center" },
    { header: "Price (₹)", key: "price", width: 16, align: "right" },
    { header: "Catalog Stock", key: "stock", width: 16, align: "center" },
    { header: "Variants Count", key: "variantsCount", width: 16, align: "center" },
    { header: "Overall Status", key: "status", width: 18, align: "center" },
    { header: "Variants Stock Breakdown", key: "breakdown", width: 48, align: "left" },
  ];

  const headerRow2 = wsOverview.getRow(4);
  headerRow2.height = 26;
  overviewColumns.forEach((col, idx) => {
    const cell = headerRow2.getCell(idx + 1);
    cell.value = col.header;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: col.align };
    cell.border = thinBorder;
  });

  let currentRowIdx2 = 5;
  let totalCatalogStock = 0;

  products.forEach((p) => {
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
    const vCount = hasVariants ? p.variants.length : 0;
    const pStock = parseInt(p.stock_quantity ?? 0, 10);
    const pPrice = parseFloat(p.price || 0);

    totalCatalogStock += pStock;

    // Build variant breakdown text
    let breakdownText = "—";
    let effectiveStock = pStock;
    if (hasVariants) {
      breakdownText = p.variants
        .map((v) => `${v.color || "Variant"}: ${v.stock_quantity ?? 0}`)
        .join("  |  ");
      // Calculate total variant stock if available
      const sumVariantStock = p.variants.reduce((acc, v) => acc + (parseInt(v.stock_quantity) || 0), 0);
      effectiveStock = sumVariantStock > 0 ? sumVariantStock : pStock;
    }

    const status = getStockStatus(effectiveStock);

    const row = wsOverview.getRow(currentRowIdx2);
    row.height = 22;
    const rowBg = currentRowIdx2 % 2 === 0 ? ROW_EVEN : ROW_ODD;

    row.values = [
      p.id,
      p.title,
      p.category || "Accessories",
      p.sku || "N/A",
      pPrice,
      pStock,
      vCount > 0 ? `${vCount} Variants` : "None",
      status,
      breakdownText,
    ];

    overviewColumns.forEach((col, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.border = thinBorder;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      cell.font = { name: "Segoe UI", size: 9.5 };
      cell.alignment = { vertical: "middle", horizontal: col.align };

      if (col.key === "price") {
        cell.numFmt = '"₹"#,##0.00';
      }
      if (col.key === "stock") {
        cell.numFmt = '#,##0';
        cell.font = { name: "Segoe UI", size: 9.5, bold: true };
      }
      if (col.key === "variantsCount" && vCount > 0) {
        cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF2563EB" } };
      }
      if (col.key === "status") {
        const st = STATUS_STYLES[status];
        if (st) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: st.fill } };
          cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: st.font } };
        }
      }
    });

    currentRowIdx2++;
  });

  // Summary Row for Sheet 2
  const totalRow2 = wsOverview.getRow(currentRowIdx2);
  totalRow2.height = 26;
  wsOverview.mergeCells(`A${currentRowIdx2}:E${currentRowIdx2}`);
  const totalLabel2 = totalRow2.getCell(1);
  totalLabel2.value = `TOTAL PRODUCTS: ${products.length}`;
  totalLabel2.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: BRAND_DARK } };
  totalLabel2.alignment = { vertical: "middle", horizontal: "right" };
  totalLabel2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };

  for (let c = 1; c <= 5; c++) {
    totalRow2.getCell(c).border = {
      top: { style: "medium", color: { argb: "FF94A3B8" } },
      bottom: { style: "double", color: { argb: "FF475569" } },
    };
  }

  const totalStockCell2 = totalRow2.getCell(6);
  totalStockCell2.value = totalCatalogStock;
  totalStockCell2.numFmt = '#,##0';
  totalStockCell2.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: BRAND_YELLOW } };
  totalStockCell2.alignment = { vertical: "middle", horizontal: "center" };
  totalStockCell2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };
  totalStockCell2.border = {
    top: { style: "medium", color: { argb: "FF94A3B8" } },
    bottom: { style: "double", color: { argb: "FF475569" } },
  };

  for (let c = 7; c <= 9; c++) {
    const emptyCell = totalRow2.getCell(c);
    emptyCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };
    emptyCell.border = {
      top: { style: "medium", color: { argb: "FF94A3B8" } },
      bottom: { style: "double", color: { argb: "FF475569" } },
    };
  }

  overviewColumns.forEach((col, idx) => {
    wsOverview.getColumn(idx + 1).width = col.width;
  });


  // -------------------------------------------------------------
  // SHEET 3: STOCK ALERTS (Low Stock & Out of Stock Checklist)
  // -------------------------------------------------------------
  const wsAlerts = workbook.addWorksheet("Stock Alerts", {
    properties: { tabColor: { argb: "FFDC2626" } },
    views: [{ showGridLines: true }],
  });

  // Header Banner
  wsAlerts.mergeCells("A1:H1");
  const title3 = wsAlerts.getCell("A1");
  title3.value = "  LBC MOTO - LOW STOCK & OUT OF STOCK RESTOCK CHECKLIST";
  title3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7F1D1D" } }; // Deep Crimson
  title3.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  title3.alignment = { vertical: "middle", horizontal: "left" };
  wsAlerts.getRow(1).height = 32;

  wsAlerts.mergeCells("A2:H2");
  const sub3 = wsAlerts.getCell("A2");
  sub3.value = `  Generated on: ${generationTimestamp}  |  Items requiring restocking (Quantity <= 5)  |  Priority Action`;
  sub3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
  sub3.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FFFEE2E2" } };
  sub3.alignment = { vertical: "middle", horizontal: "left" };
  wsAlerts.getRow(2).height = 20;

  wsAlerts.getRow(3).height = 8; // Spacer

  const alertColumns = [
    { header: "Product ID", key: "id", width: 14, align: "center" },
    { header: "Item Type", key: "type", width: 18, align: "center" },
    { header: "Product Name", key: "title", width: 44, align: "left" },
    { header: "Variant / Option", key: "variant", width: 28, align: "left" },
    { header: "SKU", key: "sku", width: 20, align: "center" },
    { header: "Current Stock", key: "stock", width: 16, align: "center" },
    { header: "Alert Level", key: "alert", width: 20, align: "center" },
    { header: "Unit Price (₹)", key: "price", width: 16, align: "right" },
  ];

  const headerRow3 = wsAlerts.getRow(4);
  headerRow3.height = 26;
  alertColumns.forEach((col, idx) => {
    const cell = headerRow3.getCell(idx + 1);
    cell.value = col.header;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: col.align };
    cell.border = thinBorder;
  });

  let currentRowIdx3 = 5;
  let outOfStockCount = 0;
  let lowStockCount = 0;

  products.forEach((p) => {
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;

    if (hasVariants) {
      p.variants.forEach((v) => {
        const vStock = parseInt(v.stock_quantity ?? 0, 10);
        if (vStock <= 5) {
          const isOut = vStock === 0;
          if (isOut) outOfStockCount++;
          else lowStockCount++;

          const row = wsAlerts.getRow(currentRowIdx3);
          row.height = 22;
          const rowBg = currentRowIdx3 % 2 === 0 ? ROW_EVEN : ROW_ODD;

          row.values = [
            p.id,
            "Variant Item",
            p.title,
            v.color || "Standard Variant",
            v.sku || p.sku || "N/A",
            vStock,
            isOut ? "OUT OF STOCK" : "LOW STOCK (<= 5)",
            parseFloat(v.price || p.price || 0),
          ];

          alertColumns.forEach((col, colIdx) => {
            const cell = row.getCell(colIdx + 1);
            cell.border = thinBorder;
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
            cell.font = { name: "Segoe UI", size: 9.5 };
            cell.alignment = { vertical: "middle", horizontal: col.align };

            if (col.key === "price") {
              cell.numFmt = '"₹"#,##0.00';
            }
            if (col.key === "stock") {
              cell.numFmt = '#,##0';
              cell.font = {
                name: "Segoe UI",
                size: 9.5,
                bold: true,
                color: { argb: isOut ? "FFDC2626" : "FFD97706" },
              };
            }
            if (col.key === "alert") {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: isOut ? "FFFEE2E2" : "FFFEF3C7" },
              };
              cell.font = {
                name: "Segoe UI",
                size: 9,
                bold: true,
                color: { argb: isOut ? "FF991B1B" : "FF92400E" },
              };
            }
          });

          currentRowIdx3++;
        }
      });
    } else {
      const pStock = parseInt(p.stock_quantity ?? 0, 10);
      if (pStock <= 5) {
        const isOut = pStock === 0;
        if (isOut) outOfStockCount++;
        else lowStockCount++;

        const row = wsAlerts.getRow(currentRowIdx3);
        row.height = 22;
        const rowBg = currentRowIdx3 % 2 === 0 ? ROW_EVEN : ROW_ODD;

        row.values = [
          p.id,
          "Standard Product",
          p.title,
          p.color ? p.color : "—",
          p.sku || "N/A",
          pStock,
          isOut ? "OUT OF STOCK" : "LOW STOCK (<= 5)",
          parseFloat(p.price || 0),
        ];

        alertColumns.forEach((col, colIdx) => {
          const cell = row.getCell(colIdx + 1);
          cell.border = thinBorder;
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
          cell.font = { name: "Segoe UI", size: 9.5 };
          cell.alignment = { vertical: "middle", horizontal: col.align };

          if (col.key === "price") {
            cell.numFmt = '"₹"#,##0.00';
          }
          if (col.key === "stock") {
            cell.numFmt = '#,##0';
            cell.font = {
              name: "Segoe UI",
              size: 9.5,
              bold: true,
              color: { argb: isOut ? "FFDC2626" : "FFD97706" },
            };
          }
          if (col.key === "alert") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: isOut ? "FFFEE2E2" : "FFFEF3C7" },
            };
            cell.font = {
              name: "Segoe UI",
              size: 9,
              bold: true,
              color: { argb: isOut ? "FF991B1B" : "FF92400E" },
            };
          }
        });

        currentRowIdx3++;
      }
    }
  });

  // Summary Row for Sheet 3
  const totalRow3 = wsAlerts.getRow(currentRowIdx3);
  totalRow3.height = 26;
  wsAlerts.mergeCells(`A${currentRowIdx3}:E${currentRowIdx3}`);
  const totalLabel3 = totalRow3.getCell(1);
  totalLabel3.value = `CRITICAL ITEMS: ${outOfStockCount} Out of Stock  |  ${lowStockCount} Low Stock (Total: ${outOfStockCount + lowStockCount})`;
  totalLabel3.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF991B1B" } };
  totalLabel3.alignment = { vertical: "middle", horizontal: "center" };
  totalLabel3.fill = { type: "pattern", pattern: "solid", fgColor: "FFFEE2E2" };

  for (let c = 1; c <= 8; c++) {
    totalRow3.getCell(c).border = {
      top: { style: "medium", color: { argb: "FFEF4444" } },
      bottom: { style: "double", color: { argb: "FF991B1B" } },
    };
  }

  alertColumns.forEach((col, idx) => {
    wsAlerts.getColumn(idx + 1).width = col.width;
  });

  // -------------------------------------------------------------
  // TRIGGER BROWSER DOWNLOAD
  // -------------------------------------------------------------
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileDate = now.toISOString().slice(0, 10);
  a.download = `LBC Moto_Inventory_${fileDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
