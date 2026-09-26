# Performance บนมือถือ — TravelDiary

วันที่ 25 กันยายน 2569 · Samsung SM-A556E · Android 16 · Expo Go (development)

## วิธีวัด

เชื่อมต่อผ่าน USB/ADB และยืนยันว่า Expo Go อยู่หน้าจอหลัก รีเซ็ตสถิติด้วย `adb shell dumpsys gfxinfo host.exp.exponent reset` แล้วให้ผู้ใช้ทดลองใช้งาน TravelDiary จากนั้นอ่าน `dumpsys gfxinfo` และ `dumpsys meminfo` ของแพ็กเกจเดียวกัน ผู้ใช้ยืนยันว่าทดลองเสร็จแล้ว แต่ไม่ได้ระบุหน้าหรือจำนวนทริปที่ใช้ จึงเป็นการสำรวจครั้งเดียว ไม่ใช่ benchmark ที่ควบคุม flow

ช่วงเก็บ 85.36 วินาที คำนวณจาก uptime 659947302 ms และ Stats since 659861942838231 ns รวมช่วงรอผู้ใช้และเวลาอนุญาตคำสั่ง โปรเซส PID 8855 คงเดิมก่อนและหลังทดสอบ

## ผล

| ตัวชี้วัด | ค่าที่อ่านได้ |
| --- | ---: |
| Total frames rendered | 1,342 |
| Janky frames | 39 (2.91%) |
| Frame time P50 / P90 / P95 / P99 | 9 / 16 / 19 / 38 ms |
| GPU time P50 / P95 | 4 / 6 ms |
| Total PSS หลังใช้งาน | 700,522 KiB (684.1 MiB) |
| Total RSS หลังใช้งาน | 806,361 KiB (787.5 MiB) |
| Total Swap PSS | 17,577 KiB (17.2 MiB) |

## ขอบเขต

- เป็นสถิติการวาดเฟรมที่ Android รายงานของ Expo Go ทั้งโปรเซส ไม่ใช่ JS FPS หรือผลของ TravelDiary release build โดยเฉพาะ
- PSS เป็นภาพรวมหน่วยความจำ ณ หลังทดสอบ ไม่ใช่ค่าเฉลี่ย ค่าสูงสุด หรือหลักฐานว่ามี memory leak
- ไม่หารจำนวนเฟรมด้วยระยะเวลารวมเพื่อรายงาน FPS เพราะช่วงหน้าจออยู่นิ่งไม่จำเป็นต้องวาดเฟรมต่อเนื่อง
- ยังไม่ได้วัด cold start, เวลาโหลดข้อมูลบนมือถือ หรือแยกวัดรายหน้าจอ
- ยังไม่สรุปว่าผ่านเกณฑ์ความลื่นไหล เพราะไม่ได้กำหนด workload และเกณฑ์ก่อนวัด

ผลดิบเก็บใน `.verification/performance-device-frames.txt` และ `.verification/performance-device-memory.txt` ภายในเครื่อง (โฟลเดอร์นี้ถูก gitignore)
