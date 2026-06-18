import * as XLSX from "xlsx-js-style";
import * as OpenCC from "opencc-js";
import { Customer, Task, TaskStatus, PN, Project } from "../types";
import { generateId, normalizeDateStr } from "../utils/helpers";

const t2cn = OpenCC.Converter({ from: "t", to: "cn" });

function isTraditional(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return t2cn(text) !== text;
}

export const excelService = {
  /**
   * 导出客户数据到 Excel
   */
  exportToExcel(customers: Customer[]) {
    const flatData: any[] = [];

    customers.forEach((customer) => {
      customer.projects.forEach((project) => {
        project.pns.forEach((pn) => {
          const convert = (text: string) => {
            if (!text) return "";
            return t2cn(text);
          };

          // Construct row with specific order of keys as requested
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

          // 18. Activity
          const activityLines = (pn.tasks || []).map(t => {
            const start = (t.startDate || "").replace(/-/g, "");
            const end = (t.endDate || "").replace(/-/g, "");
            return `${start} - ${end}：${convert(t.name)}`;
          });
          row["Activity"] = activityLines.join("\n");

          // Merge other properties from rawData if they exist, but exclude the standard keys and deprecated keys
          if (pn.rawData) {
             const standardKeys = [
               "Sales EN", 
               "Sales CN",
               "Customer Code", 
               "Customer English Name", 
               "Socket Customer Chinese Name", 
               "Customer R&D",
               "Market (Segment)",
               "Project name", 
               "Brand (Product line)", 
               "P/N", 
               "Current Status", 
               "DR status",
               "Socket Create date",
               "MP Schedule", 
               "Socket Total LTR AMT",
               "Channel OK",
               "Remark",
               "Activity",
               "Socket Customer English Name", // Deprecated key to exclude
               "_isTraditional" // Internal flag
             ];
             
             Object.keys(pn.rawData).forEach(key => {
               if (!standardKeys.includes(key)) {
                 const val = pn.rawData![key];
                 row[key] = typeof val === "string" ? t2cn(val) : val;
               }
             });
          }

          flatData.push(row);
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(flatData);

    // Apply default Chinese font to all cells
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;
        
        // Set font to Microsoft YaHei (微软雅黑)
        worksheet[cellAddress].s = {
          font: {
            name: "微软雅黑",
            sz: 11
          }
        };
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
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false });

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

          jsonData.forEach((row) => {
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

            // Convert all string fields to Simplified Chinese for the system
            const simplifiedRow: any = {};
            for (const key in row) {
              if (typeof row[key] === "string") {
                simplifiedRow[key] = t2cn(row[key]);
              } else {
                simplifiedRow[key] = row[key];
              }
            }

            const customerNameZh =
              simplifiedRow["Socket Customer Chinese Name"] || "未知客户";
            const customerNameEn =
              simplifiedRow["Customer English Name"] || "Unknown";
            const projectName = simplifiedRow["Project name"] || "默认项目";
            const pnName = simplifiedRow["P/N"] || "默认PN";

            // Find or create customer
            if (!customerMap[customerNameZh]) {
              customerMap[customerNameZh] = {
                id: generateId(),
                nameZh: customerNameZh,
                nameEn: customerNameEn,
                customerCode: simplifiedRow["Customer Code"],
                salesEn: simplifiedRow["Sales EN"],
                salesCn: simplifiedRow["Sales CN"],
                customerRd: simplifiedRow["Customer R&D"],
                projects: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
            } else {
              // Update customer info if it exists
              customerMap[customerNameZh].nameEn = customerNameEn;
              customerMap[customerNameZh].customerCode =
                simplifiedRow["Customer Code"];
              customerMap[customerNameZh].salesEn = simplifiedRow["Sales EN"];
              customerMap[customerNameZh].salesCn = simplifiedRow["Sales CN"];
              customerMap[customerNameZh].customerRd = simplifiedRow["Customer R&D"];
              customerMap[customerNameZh].updatedAt = Date.now();
            }

            // Find or create project
            let project = customerMap[customerNameZh].projects.find(
              (p) => p.name === projectName,
            );
            if (!project) {
              project = {
                id: generateId(),
                name: projectName,
                mpSchedule: normalizeDateStr(simplifiedRow["MP Schedule"] || ""),
                pns: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              customerMap[customerNameZh].projects.push(project);
            } else {
              if (simplifiedRow["MP Schedule"]) {
                project.mpSchedule = normalizeDateStr(simplifiedRow["MP Schedule"]);
              }
              project.updatedAt = Date.now();
            }

            // Parse Activity column if it exists
            const hasActivityColumn = "Activity" in simplifiedRow;
            const parsedTasks: Task[] = [];
            if (hasActivityColumn) {
              const activityStr = simplifiedRow["Activity"] || "";
              if (activityStr) {
                const lines = String(activityStr).split(/\r?\n/);
                lines.forEach(line => {
                  const match = line.match(/^(\d{8})\s*-\s*(\d{8})[：:]\s*(.+)$/);
                  if (match) {
                    const startStr = match[1];
                    const endStr = match[2];
                    const name = match[3].trim();
                    parsedTasks.push({
                      id: generateId(),
                      name: name,
                      status: "standard",
                      startDate: `${startStr.slice(0,4)}-${startStr.slice(4,6)}-${startStr.slice(6,8)}`,
                      endDate: `${endStr.slice(0,4)}-${endStr.slice(4,6)}-${endStr.slice(6,8)}`,
                      owner: "我",
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    });
                  }
                });
              }
            }

            // Find or create PN
            let pn = project.pns.find((p) => p.name === pnName);
            if (!pn) {
              const rawChannelOkStr = (simplifiedRow["Channel OK"] || simplifiedRow["渠道是否OK"] || simplifiedRow["渠道 OK"] || "").toString().trim();
              let parsedChannelOk: "Yes" | "No" = "Yes";
              if (/^(No|no|N|n|否)$/i.test(rawChannelOkStr)) {
                parsedChannelOk = "No";
              }
              const parsedRemark = simplifiedRow["Remark"] || simplifiedRow["备注"] || simplifiedRow["备注 / Remark"] || "";

              pn = {
                id: generateId(),
                name: pnName,
                productLine: simplifiedRow["Brand (Product line)"],
                status: simplifiedRow["Current Status"],
                drStatus: simplifiedRow["DR status"],
                socketCreateDate: normalizeDateStr(simplifiedRow["Socket Create date"] || ""),
                socketTotalLtrAmt: simplifiedRow["Socket Total LTR AMT"],
                marketSegment: simplifiedRow["Market (Segment)"],
                channelOk: parsedChannelOk,
                remark: parsedRemark,
                tasks: hasActivityColumn ? parsedTasks : [],
                rawData: rawData,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              project.pns.push(pn);
            } else {
              // Update PN info and rawData
              pn.productLine = simplifiedRow["Brand (Product line)"];
              pn.status = simplifiedRow["Current Status"];
              pn.drStatus = simplifiedRow["DR status"];
              pn.socketCreateDate = normalizeDateStr(simplifiedRow["Socket Create date"] || "");
              pn.socketTotalLtrAmt = simplifiedRow["Socket Total LTR AMT"];
              
              const rawChannelOkStr = (simplifiedRow["Channel OK"] || simplifiedRow["渠道是否OK"] || simplifiedRow["渠道 OK"] || "").toString().trim();
              if (rawChannelOkStr) {
                let parsedChannelOk: "Yes" | "No" = "Yes";
                if (/^(No|no|N|n|否)$/i.test(rawChannelOkStr)) {
                  parsedChannelOk = "No";
                }
                pn.channelOk = parsedChannelOk;
              }
              
              const parsedRemark = simplifiedRow["Remark"] || simplifiedRow["备注"] || simplifiedRow["备注 / Remark"];
              if (parsedRemark !== undefined) {
                pn.remark = parsedRemark;
              }

              pn.rawData = rawData;
              pn.updatedAt = Date.now();

              // Merge tasks if Activity column exists
              if (hasActivityColumn) {
                const existingTasks = [...pn.tasks];
                const newTasks: Task[] = [];
                parsedTasks.forEach(pt => {
                  const existing = existingTasks.find(et => et.name === pt.name);
                  if (existing) {
                    existing.startDate = pt.startDate;
                    existing.endDate = pt.endDate;
                    existing.updatedAt = Date.now();
                    newTasks.push(existing);
                  } else {
                    newTasks.push(pt);
                  }
                });
                pn.tasks = newTasks;
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
