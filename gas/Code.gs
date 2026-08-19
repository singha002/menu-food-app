/**
 * Google Apps Script - Restaurant Food Ordering API
 * Backend สำหรับระบบสั่งอาหาร "ร้านกินยาร์ด ก๋วยเตี๋ยวเรือ"
 * จัดการตาราง Menus, Orders, และ Settings บน Google Sheets
 */

// ชื่อแท็บของ Google Sheets
const SHEET_MENUS = "Menus";
const SHEET_ORDERS = "Orders";
const SHEET_SETTINGS = "Settings";

/**
 * Handle HTTP GET Requests
 * รองรับ:
 * - ?action=getMenus : ดึงรายการอาหารทั้งหมด
 * - ?action=getOrders : ดึงรายการออเดอร์ทั้งหมด
 * - ?action=getOrderStatus&order_id=XXX : ตรวจสอบสถานะออเดอร์
 * - ?action=getSettings : ดึงข้อมูลร้านและการตั้งค่า
 * - ?action=initSheets : สร้างแท็บและ Header เริ่มต้นอัตโนมัติ
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "getMenus";
    const orderId = e && e.parameter && e.parameter.order_id;
    let result = {};

    switch (action) {
      case "getMenus":
        result = { success: true, data: getMenusList() };
        break;

      case "getOrders":
        result = { success: true, data: getOrdersList() };
        break;

      case "getOrderStatus":
        result = { success: true, data: getSingleOrderStatus(orderId) };
        break;

      case "getSettings":
        result = { success: true, data: getShopSettings() };
        break;

      case "initSheets":
        result = { success: true, message: initializeSheets() };
        break;

      default:
        result = { success: false, message: "Unknown GET action: " + action };
        break;
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 * รองรับ:
 * - action=createOrder : บันทึกออเดอร์ใหม่จากลูกค้า
 * - action=updateOrderStatus : อัปเดตสถานะออเดอร์ (Pending -> Cooking -> Served -> Completed / Cancelled)
 * - action=toggleMenuAvailability : อัปเดตสถานะเมนู (มี/หมด)
 * - action=saveSettings : อัปเดตการตั้งค่าร้าน
 */
function doPost(e) {
  try {
    let postData = {};
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = e.parameter || {};
      }
    } else {
      postData = e.parameter || {};
    }

    const action = postData.action || (e.parameter && e.parameter.action);
    let result = {};

    switch (action) {
      case "createOrder":
        result = handleCreateOrder(postData);
        break;

      case "updateOrderStatus":
        result = handleUpdateOrderStatus(postData);
        break;

      case "toggleMenuAvailability":
        result = handleToggleMenuAvailability(postData);
        break;

      case "saveSettings":
        result = handleSaveSettings(postData);
        break;

      default:
        result = { success: false, message: "Unknown POST action: " + action };
        break;
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// ==========================================
// Helper Functions สำหรับ Database
// ==========================================

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * ดึงรายการเมนูทั้งหมดจากแผ่นงาน Menus
 */
function getMenusList() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_MENUS);
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(SHEET_MENUS);
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const menus = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // ข้ามแถวว่าง

    let optionsParsed = [];
    try {
      if (row[7]) {
        optionsParsed = typeof row[7] === 'string' ? JSON.parse(row[7]) : row[7];
      }
    } catch (err) {
      optionsParsed = [];
    }

    menus.push({
      id: String(row[0]),
      name: String(row[1] || ""),
      category: String(row[2] || "ทั่วไป"),
      price: Number(row[3] || 0),
      description: String(row[4] || ""),
      image: String(row[5] || ""),
      is_available: row[6] === true || String(row[6]).toLowerCase() === "true" || row[6] === 1,
      options: optionsParsed
    });
  }

  return menus;
}

/**
 * ดึงรายการออเดอร์ทั้งหมดจากแผ่นงาน Orders
 */
function getOrdersList() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(SHEET_ORDERS);
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const orders = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    let itemsParsed = [];
    try {
      if (row[5]) {
        itemsParsed = typeof row[5] === 'string' ? JSON.parse(row[5]) : row[5];
      }
    } catch (err) {
      itemsParsed = [];
    }

    orders.push({
      order_id: String(row[0]),
      timestamp: row[1] instanceof Date ? Utilities.formatDate(row[1], "GMT+7", "yyyy-MM-dd HH:mm:ss") : String(row[1]),
      table_no: String(row[2] || ""),
      customer_name: String(row[3] || ""),
      customer_phone: String(row[4] || ""),
      items: itemsParsed,
      total_price: Number(row[6] || 0),
      status: String(row[7] || "Pending"),
      note: String(row[8] || ""),
      payment_status: String(row[9] || "Unpaid")
    });
  }

  // เรียงลำดับจากล่าสุดขึ้นก่อน
  orders.reverse();
  return orders;
}

/**
 * ดึงสถานะของออเดอร์เดี่ยวตาม order_id
 */
function getSingleOrderStatus(orderId) {
  if (!orderId) return null;
  const orders = getOrdersList();
  const found = orders.find(o => o.order_id === orderId);
  return found || null;
}

/**
 * ดึงข้อมูลการตั้งค่าร้าน
 */
function getShopSettings() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(SHEET_SETTINGS);
  }

  const data = sheet.getDataRange().getValues();
  const settings = {
    shop_name: "ร้านกินยาร์ด ก๋วยเตี๋ยวเรือ",
    shop_status: "open",
    shop_announcement: "ยินดีต้อนรับสู่ร้านกินยาร์ด ก๋วยเตี๋ยวเรือ สูตรเด็ดต้นตำรับ",
    shop_phone: "081-234-5678",
    promptpay_no: "0812345678"
  };

  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]);
    const val = String(data[i][1]);
    if (key) {
      settings[key] = val;
    }
  }

  return settings;
}

/**
 * บันทึกออเดอร์ใหม่ลงในแผ่นงาน Orders
 */
function handleCreateOrder(data) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(SHEET_ORDERS);
  }

  // สร้าง Order ID อัตโนมัติ (เช่น ORD-20260817-1234)
  const now = new Date();
  const dateStr = Utilities.formatDate(now, "GMT+7", "yyyyMMdd");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = "ORD-" + dateStr + "-" + randomSuffix;
  const timeFormatted = Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd HH:mm:ss");

  const tableNo = data.table_no || "ไม่ระบุโต๊ะ";
  const customerName = data.customer_name || "ลูกค้าทั่วไป";
  const customerPhone = data.customer_phone || "";
  const items = data.items || [];
  const itemsJson = JSON.stringify(items);
  const totalPrice = Number(data.total_price) || 0;
  const status = "Pending"; // เริ่มต้นที่รอดำเนินการ
  const note = data.note || "";
  const paymentStatus = data.payment_status || "Unpaid";

  // เพิ่มแถวใหม่
  sheet.appendRow([
    orderId,
    timeFormatted,
    tableNo,
    customerName,
    customerPhone,
    itemsJson,
    totalPrice,
    status,
    note,
    paymentStatus
  ]);

  return {
    success: true,
    message: "บันทึกออเดอร์สำเร็จ",
    order_id: orderId,
    status: status,
    timestamp: timeFormatted,
    total_price: totalPrice
  };
}

/**
 * อัปเดตสถานะออเดอร์
 */
function handleUpdateOrderStatus(data) {
  const orderId = data.order_id;
  const newStatus = data.status; // 'Pending' | 'Cooking' | 'Served' | 'Completed' | 'Cancelled'
  const newPaymentStatus = data.payment_status;

  if (!orderId || !newStatus) {
    return { success: false, message: "Missing order_id or status" };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) return { success: false, message: "Orders sheet not found" };

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(orderId)) {
      // คอลัมน์ H (Index 8 ในชีต, 0-indexed คือ 7) คือ status
      sheet.getRange(i + 1, 8).setValue(newStatus);
      if (newPaymentStatus) {
        // คอลัมน์ J (Index 10 ในชีต, 0-indexed คือ 9) คือ payment_status
        sheet.getRange(i + 1, 10).setValue(newPaymentStatus);
      }
      return { success: true, message: "อัปเดตสถานะออเดอร์สำเร็จ", order_id: orderId, status: newStatus };
    }
  }

  return { success: false, message: "ไม่พบ Order ID: " + orderId };
}

/**
 * เปิด/ปิดสถานะพร้อมขายของเมนู
 */
function handleToggleMenuAvailability(data) {
  const menuId = data.menu_id;
  const isAvailable = data.is_available === true || String(data.is_available).toLowerCase() === "true";

  if (!menuId) return { success: false, message: "Missing menu_id" };

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_MENUS);
  if (!sheet) return { success: false, message: "Menus sheet not found" };

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(menuId)) {
      // คอลัมน์ G (Index 7 ในชีต) คือ is_available
      sheet.getRange(i + 1, 7).setValue(isAvailable);
      return { success: true, message: "อัปเดตสถานะเมนูสำเร็จ", menu_id: menuId, is_available: isAvailable };
    }
  }

  return { success: false, message: "ไม่พบ Menu ID: " + menuId };
}

/**
 * บันทึกการตั้งค่าร้าน
 */
function handleSaveSettings(data) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(SHEET_SETTINGS);
  }

  const keys = Object.keys(data.settings || {});
  const values = sheet.getDataRange().getValues();
  
  keys.forEach(k => {
    let found = false;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === k) {
        sheet.getRange(i + 1, 2).setValue(data.settings[k]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([k, data.settings[k]]);
    }
  });

  return { success: true, message: "บันทึกการตั้งค่าสำเร็จ" };
}

/**
 * สร้างชีตเริ่มต้นพร้อมข้อมูลตัวอย่างร้านกินยาร์ด
 */
function initializeSheets() {
  const ss = getSpreadsheet();

  // 1. สร้างแท็บ Menus
  let menuSheet = ss.getSheetByName(SHEET_MENUS);
  if (!menuSheet) {
    menuSheet = ss.insertSheet(SHEET_MENUS);
    menuSheet.appendRow([
      "id", "name", "category", "price", "description", "image", "is_available", "options"
    ]);

    // ตัวเลือกเส้นและระดับความเผ็ดมาตรฐาน
    const defaultNoodleOptions = JSON.stringify([
      { name: "เลือกเส้น", choices: ["เส้นเล็ก", "เส้นใหญ่", "เส้นหมี่", "บะหมี่", "วุ้นเส้น", "เกาเหลา (+10)"] },
      { name: "ระดับความเผ็ด", choices: ["ไม่เผ็ด (พริก 0 เม็ด)", "เผ็ดน้อย (พริก 1 เม็ด)", "เผ็ดปกติ (พริก 2 เม็ด)", "เผ็ดพ่นไฟ (พริก 3 เม็ด)"] },
      { name: "รูปแบบ", choices: ["น้ำตก", "ต้มยำ", "น้ำใส", "แห้ง"] },
      { name: "เพิ่มพิเศษ", choices: ["ธรรมดา", "พิเศษ (+15)", "เพิ่มกากหมู (+15)", "เพิ่มไข่ออนเซ็น (+15)"] }
    ]);

    const defaultDrinkOptions = JSON.stringify([
      { name: "ระดับความหวาน", choices: ["หวานปกติ 100%", "หวานน้อย 50%", "ไม่หวาน 0%"] },
      { name: "น้ำแข็ง", choices: ["ใส่น้ำแข็ง", "แยกน้ำแข็ง", "ไม่ใส่น้ำแข็ง"] }
    ]);

    // ข้อมูลเมนูเริ่มต้นของร้านกินยาร์ด
    const initialMenus = [
      ["M001", "ก๋วยเตี๋ยวเรือน้ำตกหมูสไลด์รสเด็ด", "ก๋วยเตี๋ยวเรือ", 60, "น้ำตกเข้มข้นสูตรโบราณ หมูนุ่ม ลูกชิ้นแน่น ผักบุ้งกรอบ", "image/images (4).jpg", true, defaultNoodleOptions],
      ["M002", "ก๋วยเตี๋ยวเรือเนื้อตุ๋น/หมูตุ๋นตับสด", "ก๋วยเตี๋ยวเรือ", 70, "เนื้อตุ๋นยาจีนเปื่อยนุ่ม หอมเครื่องเทศ เสิร์ฟพร้อมตับสดหวานฉ่ำ", "image/images (5).jpg", true, defaultNoodleOptions],
      ["M003", "ก๋วยเตี๋ยวต้มยำโบราณทรงเครื่อง", "ต้มยำ/เย็นตาโฟ", 65, "ต้มยำมะนาวสดแท้ หมูสับแผ่น แคบหมูกรอบ ถั่วคั่วหอมกรุ่น", "image/images.jpg", true, defaultNoodleOptions],
      ["M004", "บะหมี่ต้มยำน้ำข้นไข่ออนเซ็น", "ต้มยำ/เย็นตาโฟ", 75, "บะหมี่ไข่เหนียวนุ่ม ต้มยำน้ำข้นครบรส ท็อปด้วยไข่ออนเซ็นเยิ้มๆ", "image/images (1).jpg", true, defaultNoodleOptions],
      ["M005", "เย็นตาโฟทรงเครื่องเกี๊ยวกรอบ", "ต้มยำ/เย็นตาโฟ", 65, "ซอสเย็นตาโฟเต้าหู้ยี้สูตรลับ ลูกชิ้นปลา เลือดหมู ปลาหมึกกรอบ เกี๊ยวทอง", "image/images (2).jpg", true, defaultNoodleOptions],
      ["M006", "เย็นตาโฟต้มยำทะเลลูกชิ้นปลา", "ต้มยำ/เย็นตาโฟ", 75, "คู่ผสมผสานความแซ่บ ต้มยำบวกเย็นตาโฟ เครื่องแน่นจัดเต็ม", "image/images (3).jpg", true, defaultNoodleOptions],
      ["M007", "ก๋วยเตี๋ยวหมูต้มยำน้ำใสลูกชิ้นแน่น", "ต้มยำ/เย็นตาโฟ", 60, "น้ำซุปกระดูกหมูกลมกล่อม ลูกชิ้นหมูแท้ 100% หมูหมักนุ่ม", "image/images (6).jpg", true, defaultNoodleOptions],
      ["M008", "กากหมูเจียวโบราณทรงเครื่อง", "ของทานเล่น", 25, "กากหมูทอดกรอบใหม่ทุกวัน หอมกระเทียมเจียว กรุบกรอบสะใจ", "", true, "[]"],
      ["M009", "เกี๊ยวกรอบทอดไส้หมูแน่น", "ของทานเล่น", 35, "เกี๊ยวทอดเหลืองทอง กรอบนาน จิ้มน้ำจิ้มบ๊วยสูตรเด็ด", "", true, "[]"],
      ["M010", "ชาดำเย็นโบราณ", "เครื่องดื่ม", 25, "ชาไทยหอมเข้มข้น หวานชื่นใจคลายเผ็ด", "", true, defaultDrinkOptions],
      ["M011", "น้ำเก๊กฮวยเย็นชื่นใจ", "เครื่องดื่ม", 25, "ต้มจากดอกเก๊กฮวยแท้ หอมละมุน ดับกระหาย", "", true, defaultDrinkOptions],
      ["M012", "โอเลี้ยงยกล้อ", "เครื่องดื่ม", 30, "กาแฟโบราณเข้มข้นราดนมสดหอมมัน", "", true, defaultDrinkOptions]
    ];

    initialMenus.forEach(row => menuSheet.appendRow(row));
  }

  // 2. สร้างแท็บ Orders
  let orderSheet = ss.getSheetByName(SHEET_ORDERS);
  if (!orderSheet) {
    orderSheet = ss.insertSheet(SHEET_ORDERS);
    orderSheet.appendRow([
      "order_id", "timestamp", "table_no", "customer_name", "customer_phone",
      "items_json", "total_price", "status", "note", "payment_status"
    ]);
  }

  // 3. สร้างแท็บ Settings
  let settingsSheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SHEET_SETTINGS);
    settingsSheet.appendRow(["Key", "Value"]);
    settingsSheet.appendRow(["shop_name", "ร้านกินยาร์ด ก๋วยเตี๋ยวเรือ"]);
    settingsSheet.appendRow(["shop_status", "open"]);
    settingsSheet.appendRow(["shop_announcement", "ยินดีต้อนรับสู่ร้านกินยาร์ด ก๋วยเตี๋ยวเรือ สูตรเด็ดต้นตำรับ"]);
    settingsSheet.appendRow(["shop_phone", "081-234-5678"]);
    settingsSheet.appendRow(["promptpay_no", "0812345678"]);
  }

  return "สร้างแผ่นงาน Menus, Orders, และ Settings เรียบร้อยแล้ว";
}

/**
 * Format JSON Response พร้อมแก้ปัญหา CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
