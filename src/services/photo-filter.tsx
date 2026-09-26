import { ColorMatrix, Image as SkiaImage, ImageFormat, Skia, drawAsImage } from '@shopify/react-native-skia';
import { getFilter, type FilterId } from '../constants/photo-filters';
export async function filterPhoto(base64: string, filter: FilterId): Promise<string> {
  if (filter === 'normal') return `data:image/jpeg;base64,${base64}`;
  const image = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(base64));
  if (!image) throw new Error('อ่านภาพไม่สำเร็จ');
  const rendered = await drawAsImage(<SkiaImage image={image} x={0} y={0} width={image.width()} height={image.height()} fit="contain"><ColorMatrix matrix={getFilter(filter).matrix} /></SkiaImage>, { width: image.width(), height: image.height() });
  if (!rendered) { image.dispose(); throw new Error('ประมวลผลภาพไม่สำเร็จ'); }
  try { return `data:image/jpeg;base64,${rendered.encodeToBase64(ImageFormat.JPEG, 85)}`; }
  finally { rendered.dispose(); image.dispose(); }
}
