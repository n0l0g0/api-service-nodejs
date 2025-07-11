# API Service - Node.js Express

API สำหรับการจัดการข้อมูลเครื่องบิน เครื่องยนต์ และการใช้น้ำมันเครื่อง พัฒนาด้วย Node.js และ Express

## คุณสมบัติหลัก

- จัดการข้อมูลเครื่องบิน เครื่องยนต์ และการใช้น้ำมันเครื่องแบบครบครัน
- รองรับ RESTful API สำหรับการดำเนินการ CRUD ทั้งหมด
- ใช้ฐานข้อมูล PostgreSQL สำหรับจัดเก็บข้อมูล
- มีเอกสาร API ด้วย Swagger/OpenAPI
- ระบบตรวจสอบความถูกต้องของข้อมูลด้วย Middleware

### เทคโนโลยีหลักที่ใช้
- **Node.js**: Runtime สำหรับการทำงานของแอปพลิเคชัน
- **Express.js**: เฟรมเวิร์คสำหรับการสร้าง API
- **Sequelize**: ORM สำหรับการจัดการฐานข้อมูล
- **PostgreSQL**: ฐานข้อมูลหลักที่ใช้จัดเก็บข้อมูล
- **Swagger/OpenAPI**: สำหรับการสร้างเอกสาร API

## การติดตั้ง

1. clone โปรเจคจาก repo
```bash
git clone <repository-url>
cd api-service-nodejs
```

2. ติดตั้งแพ็คเกจที่จำเป็น
```bash
npm install
```

3. สร้างไฟล์ `.env` โดยคัดลอกจาก `.env.example`:
```bash
cp .env.example .env
```
4. แก้ไขไฟล์ `.env` ให้ตรงกับการตั้งค่าฐานข้อมูลของคุณ

## การใช้งาน

### run ในโหมด development
```bash
npm run dev
```

### unit test
```bash
npm test
```

## โครงสร้างโปรเจค

```
api-service-nodejs/
├── src/                    # โค้ดหลัก
│   ├── config/             # config ค่าต่างๆ (ฐานข้อมูล, ฯลฯ)
│   ├── controllers/        # controllers สำหรับจัดการ logic API
│   ├── middleware/         # middleware ตัวกลาง (Validators, ฯลฯ)
│   ├── models/             # โมเดลข้อมูล (Sequelize)
│   ├── routes/             # เส้นทาง API
│   ├── services/           # services ต่างๆ
│   ├── utils/              # fn.และยูทิลิตี้ที่ใช้ร่วมกัน
│   └── index.js            # จุดเริ่มต้นแอปพลิเคชัน
├── tests/                  # ไฟล์ unit test
├── .env.example            # ตัวอย่าง env
├── .gitignore              # ไฟล์ที่ต้องการยกเว้นจาก Git
└── package.json            # การจัดการแพ็คเกจและสคริปต์
```

## API Endpoints

เอกสาร API แบบละเอียดสามารถเข้าดูได้ที่ `http://localhost:8081/docs` หลังจาก run app
