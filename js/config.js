/**
 * Global Configuration for Kin Yard Restaurant Food Ordering System
 * กำหนดค่าเชื่อมต่อ Google Apps Script Web App และระบบจัดการข้อมูล
 */

const CONFIG = {
  // วาง URL ของ Google Apps Script Web App (ลงท้ายด้วย /exec) ที่นี่
  GAS_WEB_APP_URL: "", 

  // ข้อมูลร้านอาหาร
  SHOP_NAME: "ร้านกินยาร์ด ก๋วยเตี๋ยวเรือ",
  SHOP_TAGLINE: "สูตรเด็ดโบราณ เข้มข้นถึงใจ อร่อยไม่ต้องปรุง",
  SHOP_LOGO: "image/images (7).jpg",
  SHOP_PHONE: "081-234-5678",
  SHOP_PROMPTPAY: "081-234-5678",
  SHOP_OPEN_HOURS: "10:00 - 20:00 น.",
  
  // รายชื่อโต๊ะในร้าน
  TABLES: [
    "โต๊ะ 1 (หน้าร้าน)", "โต๊ะ 2", "โต๊ะ 3", "โต๊ะ 4", "โต๊ะ 5",
    "โต๊ะ 6", "โต๊ะ 7", "โต๊ะ 8", "โต๊ะ 9", "โต๊ะ 10",
    "โต๊ะ 11 (ห้องแอร์)", "โต๊ะ 12 (ห้องแอร์)", "กลับบ้าน / Takeaway"
  ],

  // หมวดหมู่อาหาร
  CATEGORIES: [
    { id: "all", name: "ทั้งหมด", icon: "🍜" },
    { id: "ก๋วยเตี๋ยวเรือ", name: "ก๋วยเตี๋ยวเรือ", icon: "🍲" },
    { id: "ต้มยำ/เย็นตาโฟ", name: "ต้มยำ / เย็นตาโฟ", icon: "🌶️" },
    { id: "ของทานเล่น", name: "ของทานเล่น", icon: "🥟" },
    { id: "เครื่องดื่ม", name: "เครื่องดื่มชื่นใจ", icon: "🥤" }
  ],

  // ตัวเลือกเส้นและรูปแบบมาตรฐานสำหรับก๋วยเตี๋ยว
  DEFAULT_NOODLE_OPTIONS: [
    { 
      name: "เลือกเส้น", 
      required: true,
      choices: ["เส้นเล็ก", "เส้นใหญ่", "เส้นหมี่", "บะหมี่ไข่", "วุ้นเส้น", "เกาเหลา (+10)"] 
    },
    { 
      name: "น้ำซุป / รูปแบบ", 
      required: true,
      choices: ["น้ำตกเข้มข้น", "ต้มยำมะนาวสด", "น้ำใสกลมกล่อม", "แห้ง (ปรุงรส)"] 
    },
    { 
      name: "ระดับความเผ็ด", 
      required: true,
      choices: ["ไม่เผ็ด (พริก 0 เม็ด)", "เผ็ดน้อย (พริก 1 เม็ด)", "เผ็ดปกติ (พริก 2 เม็ด)", "เผ็ดจัดจ้าน (พริก 3 เม็ด)"] 
    },
    { 
      name: "เพิ่มพิเศษ", 
      required: false,
      choices: ["ธรรมดา", "พิเศษ (+15)", "เพิ่มกากหมูเจียว (+15)", "เพิ่มไข่ออนเซ็น (+15)", "เพิ่มเกี๊ยวกรอบ (+10)"] 
    }
  ],

  // ตัวเลือกเครื่องดื่ม
  DEFAULT_DRINK_OPTIONS: [
    { 
      name: "ระดับความหวาน", 
      required: true,
      choices: ["หวานปกติ 100%", "หวานน้อย 50%", "ไม่หวาน 0%"] 
    },
    { 
      name: "น้ำแข็ง", 
      required: true,
      choices: ["ใส่น้ำแข็ง", "แยกน้ำแข็ง", "ไม่ใส่น้ำแข็ง"] 
    }
  ],

  // รายการเมนูตั้งต้น (พร้อมรูปภาพจริงจากโฟลเดอร์ image/)
  DEFAULT_MENUS: [
    {
      id: "M001",
      name: "ก๋วยเตี๋ยวเรือน้ำตกหมูสไลด์รสเด็ด",
      category: "ก๋วยเตี๋ยวเรือ",
      price: 60,
      description: "น้ำตกเข้มข้นสูตรโบราณ หมูนุ่ม ลูกชิ้นแน่น ผักบุ้งกรอบ หอมเจียวกากหมู",
      image: "image/images (4).jpg",
      is_available: true,
      options: null // จะใช้ DEFAULT_NOODLE_OPTIONS
    },
    {
      id: "M002",
      name: "ก๋วยเตี๋ยวเรือเนื้อตุ๋น/หมูตุ๋นตับสด",
      category: "ก๋วยเตี๋ยวเรือ",
      price: 70,
      description: "เนื้อตุ๋นยาจีนเปื่อยนุ่ม หอมเครื่องเทศ เสิร์ฟพร้อมตับสดหวานฉ่ำ",
      image: "image/images (5).jpg",
      is_available: true,
      options: null
    },
    {
      id: "M003",
      name: "ก๋วยเตี๋ยวต้มยำโบราณทรงเครื่อง",
      category: "ต้มยำ/เย็นตาโฟ",
      price: 65,
      description: "ต้มยำมะนาวสดแท้ หมูสับแผ่น แคบหมูกรอบ ถั่วคั่วหอมกรุ่น ปรุงครบรส",
      image: "image/images.jpg",
      is_available: true,
      options: null
    },
    {
      id: "M004",
      name: "บะหมี่ต้มยำน้ำข้นไข่ออนเซ็น",
      category: "ต้มยำ/เย็นตาโฟ",
      price: 75,
      description: "บะหมี่ไข่เหนียวนุ่ม ต้มยำน้ำข้นครบรส ท็อปด้วยไข่ออนเซ็นเยิ้มๆ และหมูแดงนุ่ม",
      image: "image/images (1).jpg",
      is_available: true,
      options: null
    },
    {
      id: "M005",
      name: "เย็นตาโฟทรงเครื่องเกี๊ยวกรอบ",
      category: "ต้มยำ/เย็นตาโฟ",
      price: 65,
      description: "ซอสเย็นตาโฟเต้าหู้ยี้สูตรลับ ลูกชิ้นปลา เลือดหมู ปลาหมึกกรอบ เกี๊ยวทองคำ",
      image: "image/images (2).jpg",
      is_available: true,
      options: null
    },
    {
      id: "M006",
      name: "เย็นตาโฟต้มยำทะเลลูกชิ้นปลา",
      category: "ต้มยำ/เย็นตาโฟ",
      price: 75,
      description: "คู่ผสมผสานความแซ่บ ต้มยำบวกเย็นตาโฟ เครื่องแน่นจัดเต็ม รสจี๊ดจ๊าด",
      image: "image/images (3).jpg",
      is_available: true,
      options: null
    },
    {
      id: "M007",
      name: "ก๋วยเตี๋ยวหมูต้มยำน้ำใสลูกชิ้นแน่น",
      category: "ต้มยำ/เย็นตาโฟ",
      price: 60,
      description: "น้ำซุปกระดูกหมูกลมกล่อม ลูกชิ้นหมูแท้ 100% หมูหมักนุ่ม ถั่วงอกกรอบสด",
      image: "image/images (6).jpg",
      is_available: true,
      options: null
    },
    {
      id: "M008",
      name: "กากหมูเจียวโบราณทรงเครื่อง",
      category: "ของทานเล่น",
      price: 25,
      description: "กากหมูทอดกรอบใหม่ทุกวัน หอมกระเทียมเจียว กรุบกรอบ ทานคู่ก๋วยเตี๋ยวฟินสุดๆ",
      image: "image/images.jpg",
      is_available: true,
      options: []
    },
    {
      id: "M009",
      name: "เกี๊ยวกรอบทอดไส้หมูแน่น",
      category: "ของทานเล่น",
      price: 35,
      description: "เกี๊ยวทอดเหลืองทอง กรอบนาน ไส้หมูปรุงรสเข้มข้น จิ้มน้ำจิ้มบ๊วยสูตรเด็ด",
      image: "image/images (2).jpg",
      is_available: true,
      options: []
    },
    {
      id: "M010",
      name: "ชาดำเย็นโบราณ",
      category: "เครื่องดื่ม",
      price: 25,
      description: "ชาไทยหอมเข้มข้น หวานชื่นใจ ดับกระหายคลายเผ็ดอย่างลงตัว",
      image: "",
      is_available: true,
      options: "drink"
    },
    {
      id: "M011",
      name: "น้ำเก๊กฮวยเย็นชื่นใจ",
      category: "เครื่องดื่ม",
      price: 25,
      description: "ต้มจากดอกเก๊กฮวยแท้ หอมละมุน หวานธรรมชาติ ดื่มแล้วสดชื่น",
      image: "",
      is_available: true,
      options: "drink"
    },
    {
      id: "M012",
      name: "โอเลี้ยงยกล้อ",
      category: "เครื่องดื่ม",
      price: 30,
      description: "กาแฟโบราณคั่วบดเข้มข้น ราดด้วยนมสดหอมมันหวานมันกลมกล่อม",
      image: "",
      is_available: true,
      options: "drink"
    }
  ],

  // ตัวอย่างข้อมูลออเดอร์เริ่มต้น (สำหรับโหมดจำลอง)
  INITIAL_MOCK_ORDERS: [
    {
      order_id: "ORD-20260817-101",
      timestamp: "2026-08-17 11:15:20",
      table_no: "โต๊ะ 3",
      customer_name: "คุณสมพงษ์",
      customer_phone: "089-111-2222",
      items: [
        {
          name: "ก๋วยเตี๋ยวเรือน้ำตกหมูสไลด์รสเด็ด",
          qty: 2,
          price: 60,
          options: "เส้นเล็ก, น้ำตกเข้มข้น, เผ็ดปกติ (พริก 2 เม็ด), เพิ่มกากหมูเจียว (+15)",
          subtotal: 150
        },
        {
          name: "กากหมูเจียวโบราณทรงเครื่อง",
          qty: 1,
          price: 25,
          options: "",
          subtotal: 25
        },
        {
          name: "ชาดำเย็นโบราณ",
          qty: 2,
          price: 25,
          options: "หวานปกติ 100%, ใส่น้ำแข็ง",
          subtotal: 50
        }
      ],
      total_price: 225,
      status: "Pending",
      note: "ขอน้ำซุปร้อนๆ ครับ",
      payment_status: "Unpaid"
    },
    {
      order_id: "ORD-20260817-102",
      timestamp: "2026-08-17 11:05:10",
      table_no: "โต๊ะ 5",
      customer_name: "คุณวิภา",
      customer_phone: "086-333-4444",
      items: [
        {
          name: "บะหมี่ต้มยำน้ำข้นไข่ออนเซ็น",
          qty: 1,
          price: 75,
          options: "บะหมี่ไข่, ต้มยำมะนาวสด, เผ็ดน้อย (พริก 1 เม็ด), ธรรมดา",
          subtotal: 75
        },
        {
          name: "เย็นตาโฟทรงเครื่องเกี๊ยวกรอบ",
          qty: 1,
          price: 65,
          options: "เส้นใหญ่, ต้มยำมะนาวสด, เผ็ดปกติ (พริก 2 เม็ด), พิเศษ (+15)",
          subtotal: 80
        }
      ],
      total_price: 155,
      status: "Cooking",
      note: "ไม่ใส่ถั่วงอก",
      payment_status: "Paid"
    },
    {
      order_id: "ORD-20260817-098",
      timestamp: "2026-08-17 10:45:00",
      table_no: "โต๊ะ 1 (หน้าร้าน)",
      customer_name: "คุณอาร์ต",
      customer_phone: "081-555-6666",
      items: [
        {
          name: "ก๋วยเตี๋ยวเรือเนื้อตุ๋น/หมูตุ๋นตับสด",
          qty: 1,
          price: 70,
          options: "เส้นหมี่, น้ำตกเข้มข้น, เผ็ดจัดจ้าน (พริก 3 เม็ด), เพิ่มไข่ออนเซ็น (+15)",
          subtotal: 85
        }
      ],
      total_price: 85,
      status: "Served",
      note: "",
      payment_status: "Unpaid"
    }
  ]
};
