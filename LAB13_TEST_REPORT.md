# Lab 13 — Test report: TravelDiary

วันที่ทดสอบ: 25 กันยายน 2569

ทดสอบ validation, การเปิด/ค้นหาทริป, ทริปโปรด, Login และการป้องกันข้อมูลส่วนตัว รวมถึง API และแผนที่ โดยใช้ Jest และ React Native Testing Library ร่วมกับ tests เดิม

## ผลการทดสอบ

| คำสั่ง | ผล |
| --- | --- |
| `npm run typecheck` | ผ่าน |
| `npm run lint` | ผ่าน ไม่มี errors/warnings |
| `npm test` | ผ่าน 25/25 (Node 4 + Jest 21) |
| `npx expo-doctor` | ผ่าน 19/21 checks |

Tests ใหม่ mock API, SecureStore และ router; API tests เดิมใช้เซิร์ฟเวอร์ local และฐานข้อมูลทดสอบ จึงไม่ต้องมี API ออนไลน์หรือใช้ข้อมูลจริง

แก้บั๊กเซสชันค้างหลังบันทึก/ลบทริปได้รับ 401 พร้อม regression tests ดู [Bug report](LAB13_BUG_REPORT.md)

## ข้อจำกัด

- Expo Doctor พบ `react-native-screens` ซ้ำ (4.26.2/4.28.0) และ patch version ไม่ตรง 7 แพ็กเกจ อาจกระทบ native build ต้องจัดเวอร์ชันและตรวจซ้ำก่อน build

หลักฐานการรันอยู่ใน `.verification/lab13-*.txt` (ถูก gitignore) สภาพแวดล้อม: Node 22.17.1, Expo 57.0.24, React Native 0.86.3
