
import { ViewStyle } from "react-native";

export type FilterId = "normal" | "mono" | "vivid";

export type PhotoFilter = {
  id: FilterId;
  label: string;
  /** ใช้ตอนวาดรูปที่ถ่ายแล้ว และตอนบันทึกลงไฟล์ */
  matrix: number[];
  /** ใช้กับภาพสดในหน้ากล้อง — ColorMatrix ใช้กับ CameraView ไม่ได้เพราะเป็น native view */
  preview: ViewStyle["filter"];
};

// เมทริกซ์เอกลักษณ์ — คืนค่าสีเดิมทุกช่อง
const NORMAL = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

// ขาวดำ — ถ่วงน้ำหนักตามความสว่างที่ตามนุษย์รับรู้ (luminance)
// ทุกช่องสีได้ค่าเท่ากัน ภาพจึงกลายเป็นเฉดเทา
const MONO = [
  0.299, 0.587, 0.114, 0, 0,
  0.299, 0.587, 0.114, 0, 0,
  0.299, 0.587, 0.114, 0, 0,
  0, 0, 0, 1, 0,
];

// สดใส — เพิ่มความอิ่มตัวของสี (saturate 1.5) แล้วเพิ่มคอนทราสต์ต่ออีก 1.12 เท่า
// ค่าติดลบในเมทริกซ์เกิดจากการดึงสีให้ห่างจากค่าเฉลี่ยความสว่าง
const VIVID = [
  1.5607, -0.4004, -0.0403, 0, -0.06,
  -0.1193, 1.2796, -0.0403, 0, -0.06,
  -0.1193, -0.4004, 1.6397, 0, -0.06,
  0, 0, 0, 1, 0,
];

export const FILTERS: PhotoFilter[] = [
  { id: "normal", label: "ปกติ", matrix: NORMAL, preview: "none" },
  { id: "mono", label: "ขาวดำ", matrix: MONO, preview: "grayscale(1)" },
  {
    id: "vivid",
    label: "สดใส",
    matrix: VIVID,
    preview: "saturate(1.5) contrast(1.12)",
  },
];

export const getFilter = (id: FilterId): PhotoFilter =>
  FILTERS.find((filter) => filter.id === id) ?? FILTERS[0];
