# 📖 คู่มือการตั้งค่า Google Sheets และ Google Apps Script (Backend)

ระบบสั่งอาหาร **"ร้านกินยาร์ด ก๋วยเตี๋ยวเรือ"**

---

## ขั้นตอนที่ 1: สร้าง Google Sheets

1. เข้าไปที่ [Google Sheets](https://sheets.new) เพื่อสร้างสเปรดชีตใหม่
2. ตั้งชื่อไฟล์ เช่น **`Database - ร้านกินยาร์ด ก๋วยเตี๋ยวเรือ`**

---

## ขั้นตอนที่ 2: ติดตั้ง Google Apps Script

1. ที่เมนูด้านบนของ Google Sheets ไปที่ **ส่วนขยาย (Extensions)** ➜ **Apps Script**
2. ลบโค้ดเริ่มต้นทั้งหมดในหน้าต่าง แล้วคัดลอกโค้ดจากไฟล์ **`gas/Code.gs`** ไปวางทั้งหมด
3. กด **บันทึกโครงการ (Save Project - รูปแผ่นดิสก์)** 💾 หรือกด `Ctrl + S`
4. ตั้งชื่อโครงการ เช่น `KinYard-Food-API`

---

## ขั้นตอนที่ 3: สร้างตารางและข้อมูลเริ่มต้น (Init Data)

1. ในหน้าต่าง Apps Script ที่แถบเครื่องมือด้านบน เลือกฟังก์ชัน **`initializeSheets`** (ข้างๆ ปุ่ม Debug)
2. กดปุ่ม **เรียกใช้ (Run)**
3. ระบบจะขออนุญาตการเข้าถึง (Authorization Required):
   - กด **ตรวจสอบสิทธิ์ (Review Permissions)**
   - เลือกบัญชี Google ของท่าน
   - หากขึ้นข้อความแจ้งเตือน "Google ยังไม่ได้ยืนยันแอปนี้" ให้กด **ขั้นสูง (Advanced)** ➜ **ไปที่ KinYard-Food-API (ไม่ปลอดภัย)**
   - กด **อนุญาต (Allow)**
4. เมื่อรันเสร็จ กลับไปดูที่ Google Sheet จะเห็นแท็บ **`Menus`**, **`Orders`**, และ **`Settings`** พร้อมข้อมูลเมนูตั้งต้นของร้านกินยาร์ดทันที! 🎉

---

## ขั้นตอนที่ 4: เผยแพร่เป็นเว็บแอป (Deploy as Web App)

1. ในหน้าต่าง Apps Script มุมขวาบน ให้คลิกปุ่มสีน้ำเงิน **การทำให้ใช้งานได้ (Deploy)** ➜ **การทำให้ใช้งานได้ใหม่ (New deployment)**
2. คลิกรูปเฟือง ⚙️ ข้าง "เลือกประเภท" แล้วเลือก **เว็บแอป (Web app)**
3. กำหนดค่าดังนี้:
   - **คำอธิบาย (Description)**: `v1.0 Food Ordering API`
   - **ดำเนินการในฐานะ (Execute as)**: **ฉัน (Me / <อีเมลของคุณ>)** *(สำคัญมาก)*
   - **ผู้มีสิทธิ์เข้าถึง (Who has access)**: **ทุกคน (Anyone)** *(สำคัญมาก เพื่อให้ Frontend เรียกใช้ได้โดยไม่ต้องล็อกอิน Google)*
4. กดปุ่ม **ทำให้ใช้งานได้ (Deploy)**
5. คัดลอก **URL เว็บแอป (Web app URL)** (ซึ่งจะลงท้ายด้วย `/exec`)
   - ตัวอย่าง: `https://script.google.com/macros/s/AKfycbx.../exec`

---

## ขั้นตอนที่ 5: นำ URL มาใส่ในโปรเจกต์ Frontend

1. เปิดไฟล์ **`js/config.js`**
2. นำ URL ที่คัดลอกมาวางที่ตัวแปร `GAS_WEB_APP_URL` ดังนี้:
   ```javascript
   const CONFIG = {
     // วาง URL ของ Google Apps Script ที่ได้จากขั้นตอนที่ 4
     GAS_WEB_APP_URL: "https://script.google.com/macros/s/AKfycbx.../exec",
     USE_MOCK_FALLBACK: true, // หากต่อเน็ตหรือยังไม่ใส่ URL จะใช้ข้อมูลจำลองให้อัตโนมัติ
     // ...
   };
   ```
3. บันทึกไฟล์ และเปิดใช้งาน `index.html` หรือ `dashboard.html` ได้ทันที!
