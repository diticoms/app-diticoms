import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Xuất file trên thiết bị Android (Native) hoặc Web
 * @param fileName Tên file (VD: Bao_Gia.pdf, Bao_Gia.xlsx)
 * @param base64Data Dữ liệu base64 (VD: 'JVBERi0xLjM...')
 * @param mimeType Kiểu file (VD: application/pdf)
 * @param dataUrl Dành cho Web: data url đầy đủ (VD: 'data:application/pdf;base64,JVBERi...')
 */
export const exportNativeFile = async (
  fileName: string,
  base64Data: string,
  mimeType: string,
  dataUrl?: string
) => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Bỏ đi phần prefix "data:image/png;base64," nếu có bị dính vào base64Data
      const cleanBase64 = base64Data.replace(/^data:[a-z-]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?;base64,/, '');

      // Ghi file vào thư mục Cache (hoặc Documents tùy chọn)
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: cleanBase64,
        directory: Directory.Cache,
      });

      // Mở Share Sheet để người dùng Lưu hoặc Gửi file
      await Share.share({
        title: fileName,
        url: savedFile.uri,
        dialogTitle: 'Lưu hoặc chia sẻ file',
      });
    } catch (error) {
      console.error('Lỗi khi lưu file native:', error);
      alert('Không thể xuất file. Vui lòng kiểm tra quyền truy cập bộ nhớ.');
    }
  } else {
    // Xử lý tải xuống thông thường trên Web
    const link = document.createElement('a');
    link.href = dataUrl || `data:${mimeType};base64,${base64Data}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
