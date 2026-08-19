# 🍜 ระบบสั่งอาหารออนไลน์และจัดการห้องครัว (Restaurant Food Ordering System)
### "ร้านกินยาร์ด ก๋วยเตี๋ยวเรือ" (Kin-Yard Boat Noodle Ordering App & Kitchen Dashboard)

เว็บแอพพลิเคชันสั่งอาหารออนไลน์สำหรับลูกค้า และแดชบอร์ดรับออเดอร์จัดการครัวแบบเรียลไทม์ เชื่อมต่อฐานข้อมูล **Google Sheets** ผ่าน **Google Apps Script**

---

## 🌟 ฟีเจอร์หลัก (Key Features)

### 1. 📱 ฝั่งลูกค้า (Customer Web App - `index.html`)
- **Mobile-First Design**: ออกแบบสวยงาม รองรับมือถือ 100%
- **ระบบเลือกโต๊ะ**: รองรับทั้งนั่งทานที่ร้าน (โต๊ะ 1-12) และสั่งกลับบ้าน (Takeaway)
- **ค้นหาและแบ่งหมวดหมู่อาหาร**: ก๋วยเตี๋ยวเรือ, ต้มยำ/เย็นตาโฟ, ของทานเล่น, เครื่องดื่ม
- **Modal ปรับแต่งอาหาร**: เลือกเส้น, น้ำซุป, ระดับความเผ็ด, เพิ่มท็อปปิ้ง และระบุหมายเหตุถึงพ่อครัว
- **ตะกร้าสินค้า (Cart Floating Drawer)**: คำนวณราคาอัตโนมัติ สรุปยอดรวมชัดเจน
- **Live Order Tracking**: ติดตามสถานะออเดอร์แบบเรียลไทม์ (รอรับออเดอร์ ➜ กำลังปรุง ➜ เสิร์ฟแล้ว ➜ เสร็จสิ้น)

### 2. 👨‍🍳 ฝั่งห้องครัวและร้านค้า (Kitchen Dashboard - `dashboard.html`)
- **Live Kanban Board**: กระดานจัดการออเดอร์ 4 สถานะ ปรับเปลี่ยนสถานะได้ในคลิกเดียว
- **ระบบเสียงเตือนออเดอร์ใหม่**: ส่งเสียงกระดิ่ง (Chime) ทันทีที่มีออเดอร์เข้า
- **จัดการสต็อกเมนู (Stock In / Out)**: สวิตช์เปิด/ปิดเมนูที่หมดได้ทันทีจากหน้าจอ
- **รายงานสรุปยอดขาย**: สรุปรายได้รวมประจำวัน จำนวนออเดอร์ และโต๊ะที่กำลังรับประทาน

---

## 📂 โครงสร้างโฟลเดอร์ในโปรเจกต์ (Project Structure)

```text
├── css/
│   ├── style.css           # สไตล์หน้าสั่งอาหารลูกค้า (Mobile-First)
│   └── dashboard.css       # สไตล์หน้า Dashboard ครัว (Dark-Slate)
├── js/
│   ├── config.js           # ตั้งค่าระบบและ Web App URL
│   ├── sound.js            # ระบบเสียงแจ้งเตือน Web Audio API
│   ├── app.js              # ตรรกะ AngularJS หน้าสั่งอาหารลูกค้า
│   └── dashboard.js        # ตรรกะ AngularJS หน้า Dashboard ครัว
├── gas/
│   ├── Code.gs             # ซอร์สโค้ด Google Apps Script Backend (API + Google Sheets)
│   └── setup_guide.md      # คู่มือการติดตั้ง Google Apps Script และ Google Sheets
├── image/                  # รูปภาพเมนูอาหารและโลโก้ร้าน
├── index.html              # หน้าเว็บสั่งอาหารสำหรับลูกค้า
├── dashboard.html          # หน้าเว็บรับออเดอร์สำหรับห้องครัว
└── README.md
```

---

## 🚀 วิธีการติดตั้งและใช้งาน

### 1. ทดสอบใช้งานแบบ Offline / Local
- ดับเบิลคลิกเปิด `index.html` เพื่อทดลองสั่งอาหาร
- ดับเบิลคลิกเปิด `dashboard.html` เพื่อดูหน้าจอรับออเดอร์ของครัว

### 2. เชื่อมต่อ Google Sheets (Live Mode)
1. ทำตามขั้นตอนใน [gas/setup_guide.md](gas/setup_guide.md) เพื่อนำโค้ดใน `gas/Code.gs` ไปวางใน Google Apps Script
2. คัดลอก **Web App URL** ที่ได้ มาใส่ในไฟล์ `js/config.js` ที่ตัวแปร `GAS_WEB_APP_URL`

---

## 🌐 การเผยแพร่ให้ลูกค้าใช้งานออนไลน์ฟรี (GitHub Pages)

1. ไปที่แท็บ **Settings** ของ Repository บน GitHub
2. ไปที่เมนู **Pages** (แถบด้านซ้าย)
3. ใต้หัวข้อ **Build and deployment > Branch** ให้เลือก Branch `main` โฟลเดอร์ `/(root)` แล้วกด **Save**
4. รอ 1-2 นาที คุณจะได้ลิงก์เว็บไซต์ เช่น `https://<your-username>.github.io/<repo-name>/` ให้ลูกค้านำไปสแกนสั่งอาหารได้ทันที!
