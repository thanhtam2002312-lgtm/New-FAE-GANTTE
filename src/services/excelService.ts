import * as XLSX from "xlsx-js-style";
import * as OpenCC from "opencc-js";
import { Customer, Task, TaskStatus, PN, Project } from "../types";
import { generateId, normalizeDateStr } from "../utils/helpers";

const t2cn = OpenCC.Converter({ from: "t", to: "cn" });

// Helper to normalize and clean header keys
function cleanKey(k: string): string {
  if (!k) return "";
  return String(k)
    .replace(/[\u00A0\s\r\n\t]+/g, "")
    .replace(/[（\(\)）_—\-\/#\.:：&]/g, "")
    .toLowerCase();
}

function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(String(text || ""));
}

function isTraditional(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return t2cn(text) !== text;
}

/**
 * 检验一个单元格的值是否为无效占位符（如 NA, N/A, #N/A, None, null, -, 未知等）
 */
export function isDummyValue(v: any): boolean {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  if (!s) return true;
  const lower = s.toLowerCase();
  return (
    lower === "na" ||
    lower === "n/a" ||
    lower === "#n/a" ||
    lower === "nan" ||
    lower === "none" ||
    lower === "null" ||
    lower === "-" ||
    lower === "--" ||
    lower === "/" ||
    lower === "\\" ||
    lower === "无" ||
    lower === "暂无" ||
    lower === "未知" ||
    lower === "未定义"
  );
}

/**
 * 智能解析提取 Brand (Product line)
 * 必须优先精确匹配包含 "Brand (Product line)" 或 "Product line" 或 "产品线" 的专用列，
 * 绝不能被纯 "Brand"（原厂品牌/客户品牌，该列常填充 NA）或无关列截胡
 */
export function extractProductLineFromRow(row: Record<string, any>): string {
  if (!row || typeof row !== "object") return "";

  const allKeys = Object.keys(row);

  // 第一优先级：明确专指产品线的表头（包含 product line 或 产品线）
  for (const key of allKeys) {
    const c = cleanKey(key);
    if (
      c === "brandproductline" ||
      c === "brandproductlines" ||
      c === "productline" ||
      c === "productlines" ||
      c === "产品线" ||
      c === "品牌产品线" ||
      /brand[\s_\-\/\(\)（）]*product[\s_\-\/\(\)（）]*line/i.test(key) ||
      /product[\s_\-\/\(\)（）]*line/i.test(key) ||
      /产品线/.test(key)
    ) {
      const val = String(row[key] || "").trim();
      if (val && !isDummyValue(val)) {
        return val;
      }
    }
  }

  // 第二优先级：包含 product 与 line 的组合列
  for (const key of allKeys) {
    const c = cleanKey(key);
    if (c.includes("productline") || (c.includes("product") && c.includes("line"))) {
      const val = String(row[key] || "").trim();
      if (val && !isDummyValue(val)) {
        return val;
      }
    }
  }

  // 第三优先级：明确的产品线缩写列 PL / ProductLine
  for (const key of allKeys) {
    const c = cleanKey(key);
    if (c === "pl" || /^pl$/i.test(key.trim())) {
      const val = String(row[key] || "").trim();
      if (val && !isDummyValue(val)) {
        return val;
      }
    }
  }

  // 第四优先级：若完全未发现任何 product line 列，才最后检查纯 Brand 列，且坚决排除无效的 NA 等占位符
  for (const key of allKeys) {
    const c = cleanKey(key);
    if (c.includes("code") || c.includes("id") || c.includes("customer")) continue;
    if (c === "brand" || c === "品牌" || /^brand$/i.test(key.trim())) {
      const val = String(row[key] || "").trim();
      if (val && !isDummyValue(val)) {
        return val;
      }
    }
  }

  return "";
}

export const excelService = {
  /**
   * 导出客户数据到 Excel
   * 规范导出标准的 18 个核心字段，自动计算列宽与行高，美化表头与单元格边框，避免多余冗余列与截断
   */
  exportToExcel(customers: Customer[]) {
    const STANDARD_COLUMNS = [
      { key: "Sales EN", width: 14, align: "center" as const },
      { key: "Sales CN", width: 12, align: "center" as const },
      { key: "Customer Code", width: 16, align: "center" as const },
      { key: "Customer English Name", width: 25, align: "left" as const },
      { key: "Socket Customer Chinese Name", width: 28, align: "left" as const },
      { key: "Customer R&D", width: 16, align: "center" as const },
      { key: "Market (Segment)", width: 18, align: "center" as const },
      { key: "Project name", width: 26, align: "left" as const },
      { key: "Brand (Product line)", width: 20, align: "left" as const },
      { key: "P/N", width: 22, align: "left" as const },
      { key: "Current Status", width: 15, align: "center" as const },
      { key: "DR status", width: 14, align: "center" as const },
      { key: "Socket Create date", width: 18, align: "center" as const },
      { key: "MP Schedule", width: 16, align: "center" as const },
      { key: "Socket Total LTR AMT", width: 20, align: "right" as const },
      { key: "Channel OK", width: 13, align: "center" as const },
      { key: "Remark", width: 26, align: "left" as const },
      { key: "Updated", width: 45, align: "left" as const, wrap: true },
      { key: "Activity", width: 50, align: "left" as const, wrap: true },
    ];

    const flatData: any[] = [];

    customers.forEach((customer) => {
      customer.projects.forEach((project) => {
        project.pns.forEach((pn) => {
          const convert = (text: string) => {
            if (!text) return "";
            return t2cn(text);
          };

          // 组织标准 18 列数据，严格保持规范顺序
          const row: any = {};

          // 1. Sales EN
          row["Sales EN"] = convert(customer.salesEn || "");
          // 2. Sales CN
          row["Sales CN"] = convert(customer.salesCn || "");
          // 3. Customer Code
          row["Customer Code"] = convert(customer.customerCode || "");
          // 4. Customer English Name
          row["Customer English Name"] = convert(customer.nameEn || "");
          // 5. Socket Customer Chinese Name
          row["Socket Customer Chinese Name"] = convert(customer.nameZh || "");
          // 6. Customer R&D
          row["Customer R&D"] = convert(customer.customerRd || "");
          // 7. Market (Segment)
          row["Market (Segment)"] = convert(pn.marketSegment || "");
          // 8. Project name
          row["Project name"] = convert(project.name || "");
          // 9. Brand (Product line)
          row["Brand (Product line)"] = convert(pn.productLine || "");
          // 10. P/N
          row["P/N"] = convert(pn.name || "");
          // 11. Current Status
          row["Current Status"] = convert(pn.status || "");
          // 12. DR status
          row["DR status"] = convert(pn.drStatus || "");
          // 13. Socket Create date
          row["Socket Create date"] = convert(pn.socketCreateDate || "");
          // 14. MP Schedule
          row["MP Schedule"] = convert(project.mpSchedule || "");
          // 15. Socket Total LTR AMT
          row["Socket Total LTR AMT"] = convert(pn.socketTotalLtrAmt || "");
          // 16. Channel OK
          row["Channel OK"] = pn.channelOk || "Yes";
          // 17. Remark
          row["Remark"] = convert(pn.remark || "");

          // 18. Updated (导入表格的 Activity (FAE/PM/Others) 或 Activity (Sales) 原文进展更新)
          row["Updated"] = convert(pn.updated || "");

          // 19. Activity (甘特图上手动维护的任务活动)
          const activityLines = (pn.tasks || []).map(t => {
            const start = (t.startDate || "").replace(/-/g, "");
            const end = (t.endDate || "").replace(/-/g, "");
            const dateStr = start && end 
              ? (start === end ? `${start}` : `${start} - ${end}`)
              : start || "";
            
            const ownerTag = t.owner && t.owner !== "我" ? `[${t.owner}] ` : "";
            const cleanName = t.name.replace(/^\[(Sales|FAE\/PM|FAE|PM|Others)\]\s*/i, "");
            const fullTaskName = `${ownerTag}${convert(cleanName)}`;

            return dateStr ? `${dateStr}：${fullTaskName}` : fullTaskName;
          });
          row["Activity"] = activityLines.join("\r\n");

          flatData.push(row);
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(flatData);

    // 1. 动态计算每一列宽度，杜绝表头被压缩截断
    const cols = STANDARD_COLUMNS.map((col) => {
      let maxLen = 0;
      // 表头字数长度（中文计2字符）
      for (let i = 0; i < col.key.length; i++) {
        maxLen += col.key.charCodeAt(i) > 255 ? 2 : 1;
      }

      flatData.forEach((row) => {
        const val = String(row[col.key] || "");
        if (col.key === "Activity" || col.key === "Updated") {
          const lines = val.split(/[\r\n]+/);
          lines.forEach((l) => {
            let lineLen = 0;
            for (let i = 0; i < l.length; i++) {
              lineLen += l.charCodeAt(i) > 255 ? 2 : 1;
            }
            if (lineLen > maxLen) maxLen = Math.min(lineLen, 65);
          });
        } else {
          let valLen = 0;
          for (let i = 0; i < val.length; i++) {
            valLen += val.charCodeAt(i) > 255 ? 2 : 1;
          }
          if (valLen > maxLen) maxLen = valLen;
        }
      });

      const calculatedWidth = Math.max(col.width, maxLen + 3);
      const finalWidth = (col.key === "Activity" || col.key === "Updated")
        ? Math.min(Math.max(calculatedWidth, 45), 75) 
        : Math.min(calculatedWidth, 45);
      return { wch: finalWidth };
    });
    worksheet["!cols"] = cols;

    // 2. 计算每一行行高，Activity 或 Updated 多行时自动撑开行高
    const rowHeights: { hpt: number }[] = [{ hpt: 30 }]; // 表头高度
    flatData.forEach((row) => {
      const act = String(row["Activity"] || "");
      const upd = String(row["Updated"] || "");
      const actLines = act ? act.split(/[\r\n]+/).filter(Boolean).length : 1;
      const updLines = upd ? upd.split(/[\r\n]+/).filter(Boolean).length : 1;
      const lines = Math.max(actLines, updLines);
      const h = Math.min(240, Math.max(24, lines * 19));
      rowHeights.push({ hpt: h });
    });
    worksheet["!rows"] = rowHeights;

    // 3. 冻结首行表头
    worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
    worksheet["!views"] = [{ state: "frozen", ySplit: 1 }];

    // 4. 统一美化所有单元格（微软雅黑字体、专业边框、表头灰白底色、清晰对齐）
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");

    const headerBorder = {
      top: { style: "thin", color: { rgb: "D0D5DD" } },
      bottom: { style: "medium", color: { rgb: "98A2B3" } },
      left: { style: "thin", color: { rgb: "D0D5DD" } },
      right: { style: "thin", color: { rgb: "D0D5DD" } },
    };

    const dataBorder = {
      top: { style: "thin", color: { rgb: "EAECF0" } },
      bottom: { style: "thin", color: { rgb: "EAECF0" } },
      left: { style: "thin", color: { rgb: "EAECF0" } },
      right: { style: "thin", color: { rgb: "EAECF0" } },
    };

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const isHeader = R === 0;
      const isEven = R % 2 === 0;
      const bgRgb = isEven ? "F9FAFB" : "FFFFFF";

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) {
          worksheet[cellAddress] = { t: "s", v: "" };
        }
        
        const colDef = STANDARD_COLUMNS[C] || { key: "", width: 15, align: "left" as const, wrap: false };

        if (isHeader) {
          worksheet[cellAddress].s = {
            font: {
              name: "微软雅黑",
              sz: 10.5,
              bold: true,
              color: { rgb: "1D2939" },
            },
            fill: {
              fgColor: { rgb: "F2F4F7" },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
              wrapText: false,
            },
            border: headerBorder,
          };
        } else {
          const isMultiLine = colDef.key === "Activity" || colDef.key === "Updated";
          worksheet[cellAddress].s = {
            font: {
              name: "微软雅黑",
              sz: 9.5,
              color: { rgb: "344054" },
            },
            fill: {
              fgColor: { rgb: bgRgb },
            },
            alignment: {
              vertical: isMultiLine ? "top" : "center",
              horizontal: colDef.align || "left",
              wrapText: isMultiLine || colDef.wrap || false,
            },
            border: dataBorder,
          };
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FAE项目进度");
    XLSX.writeFile(
      workbook,
      `FAE项目进度_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  },

  /**
   * 从 Excel 导入数据并重建层级，保留现有的任务
   * 采用智能多别名模糊匹配机制，兼容各类表头格式（中文名/英文名/Account RD/DR#/简写截断等）
   */
  async importFromExcel(
    file: File,
    existingCustomers: Customer[],
  ): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false, defval: "" });

          // Create a deep copy of existing customers to merge into
          const customerMap: Record<string, Customer> = {};

          // Initialize map with existing customers
          existingCustomers.forEach((c) => {
            customerMap[c.nameZh] = {
              ...c,
              projects: c.projects.map((p) => ({
                ...p,
                pns: p.pns.map((pn) => ({ ...pn, tasks: [...pn.tasks] })),
              })),
            };
          });

          // Helper to normalize and clean header keys
          const cleanKey = (k: string) => {
            if (!k) return "";
            return String(k)
              .replace(/[\u00A0\s\r\n\t]+/g, "")
              .replace(/[（\(\)）_—\-\/#\.:：&]/g, "")
              .toLowerCase();
          };

          const hasChinese = (text: string) => /[\u4e00-\u9fa5]/.test(String(text || ""));

          jsonData.forEach((row) => {
            // Check if row has any non-empty cell
            const hasData = Object.values(row).some((val) => String(val || "").trim() !== "");
            if (!hasData) return;

            // Check if the row contains traditional Chinese
            let rowIsTraditional = false;
            for (const key in row) {
              if (typeof row[key] === "string" && isTraditional(row[key])) {
                rowIsTraditional = true;
                break;
              }
            }

            // Store the original row data and the flag
            const rawData = { ...row, _isTraditional: rowIsTraditional };

            // Convert all string keys and values to Simplified Chinese
            const simplifiedRow: Record<string, any> = {};
            for (const key in row) {
              const simpKey = t2cn(String(key).trim());
              const val = row[key];
              if (typeof val === "string") {
                simplifiedRow[simpKey] = t2cn(val.trim());
              } else {
                simplifiedRow[simpKey] = val;
              }
            }

            const allKeys = Object.keys(simplifiedRow);

            // ==================== 1. 客户中文名 & 客户英文名 ====================
            let customerNameZh = "";
            let customerNameEn = "";

            // 1a. Explicit Chinese Name column header
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (
                c === "socketcustomerchinesename" ||
                c === "customerchinesename" ||
                c === "customercn" ||
                c === "customerchinese" ||
                c === "customernamecn" ||
                c === "socketcustomercn" ||
                c === "客户中文名" ||
                c === "客户中文名称" ||
                c === "客户中文" ||
                c === "客户名称中文" ||
                /customer.*cn/i.test(key) ||
                /客户.*中/.test(key)
              ) {
                customerNameZh = val;
                break;
              }
            }

            // 1b. Explicit English Name column header
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (
                c === "customerenglishname" ||
                c === "customerenglish" ||
                c === "customeren" ||
                c === "customernameen" ||
                c === "socketcustomerenglishname" ||
                c === "客户英文名" ||
                c === "客户英文名称" ||
                c === "客户英文" ||
                /customer.*en/i.test(key) ||
                /客户.*英/.test(key)
              ) {
                customerNameEn = val;
                break;
              }
            }

            // 1c. Generic Customer columns (e.g. "Customer", "Customer_1", "客户", "客户名称")
            // Disambiguate by content: if cell contains Chinese characters => nameZh; else => nameEn
            const genericCustomerCols = allKeys.filter((k) => {
              const c = cleanKey(k);
              if (c.includes("rd") || c.includes("code") || c.includes("id") || c.includes("sale") || c.includes("end") || c.includes("opp")) {
                return false;
              }
              return c.includes("customer") || c.includes("客户");
            });

            for (const key of genericCustomerCols) {
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (hasChinese(val)) {
                if (!customerNameZh) customerNameZh = val;
              } else {
                if (!customerNameEn) customerNameEn = val;
              }
            }

            // Fallback cross-assignment so that neither is blank
            if (!customerNameZh && customerNameEn) customerNameZh = customerNameEn;
            if (!customerNameEn && customerNameZh) customerNameEn = customerNameZh;
            if (!customerNameZh) customerNameZh = "未知客户";
            if (!customerNameEn) customerNameEn = "Unknown";

            // ==================== 2. 客户 RD (Account RD / Customer R&D) ====================
            let customerRd = "";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              // Must not be DR Status (DR#) or Board Name or Account Rep
              if (/^dr\b/i.test(key) || c.includes("drstatus") || c.includes("dr#") || c.includes("board") || /rep|representative/i.test(key)) {
                continue;
              }

              if (
                c === "customerrd" ||
                c === "customerrandd" ||
                c === "customerrdwindow" ||
                c === "accountrd" ||
                c === "accountrandd" ||
                c === "accountrdwindow" ||
                c === "客户rd" ||
                c === "客户研发" ||
                c === "客户研发负责人" ||
                c === "客户研发窗口" ||
                c === "客户rd窗口" ||
                c === "rdwindow" ||
                c === "rd" ||
                c === "randd" ||
                c === "研发负责人" ||
                c === "研发窗口" ||
                c === "研发" ||
                /^(customer|account|client|客户)[\s_\-\/]*(r&?d|研发)/i.test(key) ||
                /^(r&?d|研发)[\s_\-\/]*(window|窗口|负责人)?$/i.test(key)
              ) {
                customerRd = val;
                break;
              }
            }

            // If still not found, check columns starting with "Account R" that are NOT "Account Rep"
            if (!customerRd) {
              for (const key of allKeys) {
                if (/^account[\s_\-\/]*r/i.test(key) && !/rep|representative/i.test(key)) {
                  const val = String(simplifiedRow[key] || "").trim();
                  if (val) {
                    customerRd = val;
                    break;
                  }
                }
              }
            }

            // ==================== 3. 客户代码 (Customer Code) ====================
            let customerCode = "";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (
                c === "customercode" ||
                c === "customerid" ||
                c === "customerno" ||
                c === "customernumber" ||
                c === "客户代码" ||
                c === "客户编号" ||
                c === "客户id" ||
                c === "客户code" ||
                /(customer|client|客户)[\s_\-\/]*(code|id|no|number|代码|编号)/i.test(key)
              ) {
                customerCode = val;
                break;
              }
            }

            // ==================== 4. 业务英文 & 业务中文 (Sales EN / CN) ====================
            let salesEn = "";
            let salesCn = "";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (!salesEn && (
                c === "salesen" ||
                c === "salesenglish" ||
                c === "salesrepen" ||
                c === "salesnameen" ||
                c === "业务英文" ||
                c === "销售英文" ||
                c === "业务员英文" ||
                /sales.*en/i.test(key) ||
                /(业务|销售).*英/.test(key)
              )) {
                salesEn = val;
              } else if (!salesCn && (
                c === "salescn" ||
                c === "saleschinese" ||
                c === "salesrepcn" ||
                c === "salesnamecn" ||
                c === "业务中文" ||
                c === "销售中文" ||
                c === "业务员中文" ||
                /sales.*cn/i.test(key) ||
                /(业务|销售).*中/.test(key)
              )) {
                salesCn = val;
              }
            }

            // ==================== 5. 项目名称 (Project name) ====================
            let projectName = "";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              // Must not be Project Created Date or Project Total AMT
              if (c.includes("date") || c.includes("create") || c.includes("total") || c.includes("amt")) {
                continue;
              }

              if (
                c === "projectname" ||
                c === "projectna" ||
                c === "project" ||
                c === "项目名称" ||
                c === "项目名" ||
                c === "项目" ||
                /^project([\s_\-\/]*(name|na))?$/i.test(key) ||
                /^项目(名称|名)?$/.test(key)
              ) {
                projectName = val;
                break;
              }
            }
            if (!projectName) projectName = "默认项目";

            // ==================== 6. 料号 P/N ====================
            let pnName = "";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (
                c === "pn" ||
                c === "partnumber" ||
                c === "partno" ||
                c === "part" ||
                c === "料号" ||
                c === "型号" ||
                c === "产品型号" ||
                c === "零件号" ||
                /^(p[\s_\-\/]*n|part[\s_\-\/]*(number|no|#)?|料号|型号)$/i.test(key)
              ) {
                pnName = val;
                break;
              }
            }
            if (!pnName) pnName = "默认PN";

            // ==================== 7. MP Schedule ====================
            let mpSchedule = "";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              // Must not be PP Schedule
              if (c.includes("pp")) continue;

              if (
                c === "mpschedule" ||
                c === "mpdate" ||
                c === "mp" ||
                c === "massproductionschedule" ||
                c === "量产时间" ||
                c === "量产日期" ||
                c === "量产时程" ||
                c === "预计量产时间" ||
                /mp[\s_\-\/]*(schedule|date|时程|时间|日期)?/i.test(key) ||
                /(量产|massproduction)[\s_\-\/]*(schedule|date|时程|时间|日期)?/i.test(key)
              ) {
                mpSchedule = normalizeDateStr(val);
                break;
              }
            }

            // ==================== 8. Brand (Product line) ====================
            // 优先精准匹配 "Brand (Product line)" 或 "Product line" / "产品线"，绝不被纯 Brand 列截胡
            let productLine = extractProductLineFromRow(simplifiedRow);
            if (!productLine && rawData) {
              productLine = extractProductLineFromRow(rawData);
            }

            // ==================== 9. Current Status / Stage ====================
            let status = "";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (
                c === "currentstatus" ||
                c === "currentstage" ||
                c === "currents" ||
                c === "status" ||
                c === "stage" ||
                c === "当前状态" ||
                c === "状态" ||
                c === "项目状态" ||
                c === "当前阶段" ||
                c === "阶段" ||
                /current[\s_\-\/]*(status|stage|s)/i.test(key) ||
                /^(status|stage|状态|阶段)$/i.test(key)
              ) {
                status = val;
                break;
              }
            }

            // ==================== 10. DR status / DR# ====================
            let drStatus = "";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (
                c === "drstatus" ||
                c === "dr" ||
                c === "drno" ||
                c === "dr状态" ||
                /^dr([\s_\-\/#]*(status|no|number|状态)?)?$/i.test(key)
              ) {
                drStatus = val;
                break;
              }
            }

            // ==================== 11. Socket Create date ====================
            let socketCreateDate = "";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (
                c === "socketcreatedate" ||
                c === "socketcreate" ||
                c === "createdate" ||
                c === "socket创建日期" ||
                c === "创建日期" ||
                c === "立项日期" ||
                /socket[\s_\-\/]*create/i.test(key) ||
                /create[\s_\-\/]*date/i.test(key) ||
                /(创建|立项)[\s_\-\/]*日期/.test(key)
              ) {
                socketCreateDate = normalizeDateStr(val);
                break;
              }
            }

            // ==================== 12. Socket Total LTR AMT ====================
            let socketTotalLtrAmt = "";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (
                c === "sockettotalltramt" ||
                c === "sockettotalamt" ||
                c === "sockettotalamount" ||
                c === "sockettotal" ||
                c === "sockettota" ||
                c === "projecttotalltramt" ||
                c === "projecttotal" ||
                c === "projecttot" ||
                c === "totalltramt" ||
                c === "totalamt" ||
                c === "socket金额" ||
                c === "总金额" ||
                c === "金额" ||
                /(socket|project)?[\s_\-\/]*total[\s_\-\/]*(ltr)?[\s_\-\/]*(amt|amount|金额)?/i.test(key)
              ) {
                socketTotalLtrAmt = val;
                break;
              }
            }

            // ==================== 13. Market (Segment) ====================
            let marketSegment = "";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (
                c === "marketsegment" ||
                c === "markets" ||
                c === "market" ||
                c === "segment" ||
                c === "市场细分" ||
                c === "细分市场" ||
                c === "行业" ||
                /market/i.test(key) ||
                /segment/i.test(key) ||
                /(市场|细分市场)/.test(key)
              ) {
                marketSegment = val;
                break;
              }
            }

            // ==================== 14. Channel OK ====================
            let channelOk: "Yes" | "No" = "Yes";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (
                c === "channelok" ||
                c === "channel" ||
                c === "渠道是否ok" ||
                c === "渠道ok" ||
                c === "渠道" ||
                /channel/i.test(key) ||
                /渠道/.test(key)
              ) {
                if (/^(No|no|N|n|否|false|0)$/i.test(val)) {
                  channelOk = "No";
                } else {
                  channelOk = "Yes";
                }
                break;
              }
            }

            // ==================== 15. Remark ====================
            let remark = "";
            for (const key of allKeys) {
              const c = cleanKey(key);
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;

              if (
                c === "remark" ||
                c === "remarks" ||
                c === "note" ||
                c === "notes" ||
                c === "comment" ||
                c === "comments" ||
                c === "备注" ||
                c === "说明" ||
                /remark/i.test(key) ||
                /note/i.test(key) ||
                /(备注|说明)/.test(key)
              ) {
                remark = val;
                break;
              }
            }

            // ==================== 16. Activity & Tasks (Multi-column Support) ====================
            // 识别所有可能包含活动/任务进展的列：
            // 1. Activity (FAE/PM/Others) / Activity (F / FAE Activity
            // 2. Activity (Sales) / Activity (S / Sales Activity
            // 3. 通用 Activity / 进展 / 任务列
            // ==================== 16. Updated 进展更新 (FAE/PM 与 Sales) 提取 ====================
            // 原 Excel 中：
            // - "Activity (FAE/PM/Others)" 为技术/项目进展 (Weekly update, Call Report 等)
            // - "Activity (Sales)" 为销售业务跟进进展 (Call Report 等)
            // - "Updated" / "Update" / "最新进展" / "更新" / "进展更新"
            // 这些必须存入 pn.updated（即表格中的 Updated 列），绝不能转为甘特图任务！
            let faeUpdateText = "";
            let salesUpdateText = "";
            let directUpdatedText = "";
            let dedicatedGanttActivityText = "";

            for (const key of allKeys) {
              const val = String(simplifiedRow[key] || "").trim();
              if (!val) continue;
              const c = cleanKey(key);

              // 1. Direct Updated column: "Updated", "Update", "更新", "最新进展", "进展更新"
              if (
                c === "updated" ||
                c === "update" ||
                c === "更新" ||
                c === "最新进展" ||
                c === "进展更新" ||
                /^(updated|update|更新|最新进展)$/i.test(key)
              ) {
                directUpdatedText = val;
                continue;
              }

              // 2. FAE/PM/Others Activity:
              // Matches: Activity (FAE/PM/Others), Activity (FAE/PM), Activity (FAE), Activity (PM), Activity (Others), FAE Activity, PM Activity
              if (
                /^activity[\s_\-\/]*\(\s*f/i.test(key) ||
                /^activity[\s_\-\/]*\(\s*p/i.test(key) ||
                /^activity[\s_\-\/]*\(\s*o/i.test(key) ||
                c === "activityfaepmothers" ||
                c === "activityfaepmother" ||
                c === "activityfaepm" ||
                c === "activityfae" ||
                c === "activitypm" ||
                c === "activityf" ||
                c === "faeactivity" ||
                c === "pmactivity" ||
                ((c.includes("fae") || c.includes("pm") || c.includes("other")) && (c.includes("activity") || /活动|进展|task/.test(key)))
              ) {
                faeUpdateText = faeUpdateText ? `${faeUpdateText}\n${val}` : val;
                continue;
              }

              // 3. Sales Activity:
              // Matches: Activity (Sales), Activity (S), Sales Activity, Activity Sales
              if (
                /^activity[\s_\-\/]*\(\s*s/i.test(key) ||
                c === "activitysales" ||
                c === "activitysale" ||
                c === "activitys" ||
                c === "salesactivity" ||
                ((c.includes("sale") || /业务|销售/.test(key)) && (c.includes("activity") || /活动|进展|task/.test(key)))
              ) {
                salesUpdateText = salesUpdateText ? `${salesUpdateText}\n${val}` : val;
                continue;
              }

              // 4. Standalone dedicated Gantt Activity column (例如本系统导出的 Activity 任务列)
              // Header 必须是独立的 Activity / Tasks / 甘特图活动，且不含 FAE 或 Sales
              if (
                (c === "activity" || c === "activities" || c === "tasks" || c === "甘特图活动" || c === "甘特图任务") &&
                !c.includes("fae") && !c.includes("pm") && !c.includes("sale")
              ) {
                dedicatedGanttActivityText = val;
                continue;
              }
            }

            // 合成 pn.updated 文本
            let updatedText = "";
            if (directUpdatedText) {
              updatedText = directUpdatedText;
              if (faeUpdateText && !directUpdatedText.includes(faeUpdateText)) {
                updatedText = `${updatedText}\n\n[FAE/PM 进展]\n${faeUpdateText}`;
              }
              if (salesUpdateText && !directUpdatedText.includes(salesUpdateText)) {
                updatedText = `${updatedText}\n\n[Sales 进展]\n${salesUpdateText}`;
              }
            } else if (faeUpdateText && salesUpdateText) {
              updatedText = `[FAE/PM 进展]\n${faeUpdateText}\n\n[Sales 进展]\n${salesUpdateText}`;
            } else if (faeUpdateText) {
              updatedText = faeUpdateText;
            } else if (salesUpdateText) {
              updatedText = salesUpdateText;
            }

            // ==================== 16.5 甘特图任务 (Task) 提取 ====================
            // 注意：Activity (FAE/PM/Others) 和 Activity (Sales) 是跟进进展，归入 Updated，绝不转为甘特图任务！
            // 最右边的 Activity 专门对应用户在甘特图上手动添加的任务。
            // 只有当导入的表格带有纯粹独立的甘特图任务列（如本系统重新导出的表格），且不含 Call Report/Weekly update 时才做任务解析。
            const parsedTasks: Task[] = [];
            const todayStr = new Date().toISOString().slice(0, 10);
            const fallbackDate = socketCreateDate || mpSchedule || todayStr;

            if (dedicatedGanttActivityText && !faeUpdateText && !salesUpdateText) {
              const rawLines = String(dedicatedGanttActivityText).split(/\r?\n|;/);
              rawLines.forEach((rawLine) => {
                let line = rawLine.trim();
                if (!line) return;
                // 过滤掉 Call Report 或 Weekly update
                if (/call report/i.test(line) || /weekly update/i.test(line)) return;

                line = line.replace(/^[-*•·●]\s*/, "").replace(/^\d+[\.、]\s*/, "").trim();
                if (!line) return;

                let start = "";
                let end = "";
                let name = "";

                // 1. Two-date range: YYYYMMDD-YYYYMMDD or YYYY-MM-DD - YYYY-MM-DD
                const rangeMatch = line.match(
                  /^(\d{4}[-/.]?\d{2}[-/.]?\d{2})\s*[-~至到/]\s*(\d{4}[-/.]?\d{2}[-/.]?\d{2})[：:\s\-—]*(.*)$/
                );
                if (rangeMatch) {
                  start = normalizeDateStr(rangeMatch[1]);
                  end = normalizeDateStr(rangeMatch[2]);
                  name = rangeMatch[3].trim();
                } else {
                  // 2. Single date
                  const singleMatch = line.match(
                    /^(\d{4}[-/.]?\d{2}[-/.]?\d{2})[：:\s\-—]+(.*)$/
                  );
                  if (singleMatch) {
                    start = normalizeDateStr(singleMatch[1]);
                    end = start;
                    name = singleMatch[2].trim();
                  } else {
                    start = fallbackDate;
                    end = fallbackDate;
                    name = line;
                  }
                }

                if (!name) name = line;

                let owner = "我";
                const ownerMatch = name.match(/^\[([^\]]+)\]\s*(.*)$/);
                if (ownerMatch) {
                  owner = ownerMatch[1];
                  name = ownerMatch[2];
                }

                parsedTasks.push({
                  id: generateId(),
                  name: name,
                  status: "standard",
                  startDate: start || fallbackDate,
                  endDate: end || start || fallbackDate,
                  owner: owner,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                });
              });
            }

            // Deduplicate tasks within the same PN
            const uniqueTasks: Task[] = [];
            parsedTasks.forEach((pt) => {
              const isDuplicate = uniqueTasks.some(
                (ut) => ut.name === pt.name && ut.startDate === pt.startDate && ut.endDate === pt.endDate
              );
              if (!isDuplicate) {
                uniqueTasks.push(pt);
              }
            });

            // ==================== 17. Merge into Customer Map ====================
            // Find existing customer by nameZh OR nameEn
            let customer = customerMap[customerNameZh];
            if (!customer) {
              customer = Object.values(customerMap).find(
                (c) => (customerNameZh && c.nameZh === customerNameZh) ||
                       (customerNameEn && customerNameEn !== "Unknown" && c.nameEn === customerNameEn)
              );
            }

            if (!customer) {
              customer = {
                id: generateId(),
                nameZh: customerNameZh,
                nameEn: customerNameEn,
                customerCode: customerCode,
                salesEn: salesEn,
                salesCn: salesCn,
                customerRd: customerRd,
                projects: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              customerMap[customerNameZh] = customer;
            } else {
              // Update customer info with non-empty values
              if (customerNameZh && customerNameZh !== "未知客户") customer.nameZh = customerNameZh;
              if (customerNameEn && customerNameEn !== "Unknown") customer.nameEn = customerNameEn;
              if (customerCode) customer.customerCode = customerCode;
              if (salesEn) customer.salesEn = salesEn;
              if (salesCn) customer.salesCn = salesCn;
              if (customerRd) customer.customerRd = customerRd;
              customer.updatedAt = Date.now();
            }

            // Find or create project
            let project = customer.projects.find((p) => p.name === projectName);
            if (!project) {
              project = {
                id: generateId(),
                name: projectName,
                mpSchedule: mpSchedule,
                pns: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              customer.projects.push(project);
            } else {
              if (mpSchedule) project.mpSchedule = mpSchedule;
              project.updatedAt = Date.now();
            }

            // Find or create PN
            let pn = project.pns.find((p) => p.name === pnName);
            if (!pn) {
              pn = {
                id: generateId(),
                name: pnName,
                productLine: isDummyValue(productLine) ? "" : productLine,
                status: (status as any) || "Leads",
                drStatus: drStatus,
                socketCreateDate: socketCreateDate,
                socketTotalLtrAmt: socketTotalLtrAmt,
                marketSegment: marketSegment,
                channelOk: channelOk,
                remark: remark,
                updated: updatedText,
                tasks: uniqueTasks,
                rawData: rawData,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              project.pns.push(pn);
            } else {
              if (productLine && !isDummyValue(productLine)) {
                pn.productLine = productLine;
              } else if (isDummyValue(pn.productLine)) {
                pn.productLine = "";
              }
              if (status) pn.status = status as any;
              if (drStatus) pn.drStatus = drStatus;
              if (socketCreateDate) pn.socketCreateDate = socketCreateDate;
              if (socketTotalLtrAmt) pn.socketTotalLtrAmt = socketTotalLtrAmt;
              if (marketSegment) pn.marketSegment = marketSegment;
              if (channelOk) pn.channelOk = channelOk;
              if (remark) pn.remark = remark;
              if (updatedText) pn.updated = updatedText;
              pn.rawData = rawData;
              pn.updatedAt = Date.now();

              // 清理之前可能误导入的 Call Report / Weekly update 任务（确保甘特图任务纯净）
              const cleanedExistingTasks = (pn.tasks || []).filter((t) => {
                if (t.owner === "FAE/PM" || t.owner === "Sales") return false;
                if (
                  t.name.startsWith("[FAE/PM]") ||
                  t.name.startsWith("[Sales]") ||
                  t.name.startsWith("[FAE]") ||
                  t.name.startsWith("[PM]")
                )
                  return false;
                if (/call report/i.test(t.name) || /weekly update/i.test(t.name)) return false;
                return true;
              });

              // 仅当导入带有明确的甘特图活动列时才合并，否则严格保留用户在甘特图上手动维护的任务
              if (uniqueTasks.length > 0) {
                const mergedTasks: Task[] = [...cleanedExistingTasks];
                uniqueTasks.forEach((pt) => {
                  const existingIndex = mergedTasks.findIndex((et) => et.name === pt.name);
                  if (existingIndex >= 0) {
                    mergedTasks[existingIndex] = {
                      ...mergedTasks[existingIndex],
                      startDate: pt.startDate,
                      endDate: pt.endDate,
                      owner: pt.owner || mergedTasks[existingIndex].owner,
                      updatedAt: Date.now(),
                    };
                  } else {
                    mergedTasks.push(pt);
                  }
                });
                pn.tasks = mergedTasks;
              } else {
                pn.tasks = cleanedExistingTasks;
              }
            }
          });

          resolve(Object.values(customerMap));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },
};
