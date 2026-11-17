# Web V48 — Thư viện mặt đồng hồ (trang riêng)

Trang mới theo mẫu “Thư viện có ảnh”. Giữ nguyên trang GitHub cũ cho thiết bị cũ.
Không cần nạp lại firmware chỉ để đổi giao diện web này.

## Đưa lên GitHub Pages

1. Giải nén gói `EPD_WEB_V48_THU_VIEN_GITHUB.zip`.
2. Tạo repository mới, hoặc thư mục mới trong repository đang dùng.
3. Tải `index.html` vào vị trí mới đó. Không ghi đè `index.html` của trang cũ.
4. Bật GitHub Pages nếu là repository mới. Nếu dùng thư mục mới, truy cập đường dẫn có tên thư mục đó.
5. Dùng HTTPS trên Chrome/Edge máy tính hoặc Bluefy trên iPhone.

`index.html` độc lập: có sẵn ảnh minh họa, bộ font và tranh mẫu; không cần tải thêm file tài nguyên, font hoặc thư viện từ CDN. Tuy nhiên vẫn phải mở bằng trình duyệt hỗ trợ Bluetooth, trên nguồn an toàn (HTTPS).

## Dành cho người sử dụng

- Kết nối: chọn đúng tên C26_... trên màn hình thiết bị.
- Mặt đồng hồ: chạm ảnh để chọn; bấm **Áp dụng** mới gửi lệnh.
- Ảnh & hình nền: chọn ảnh, căn/cắt/xoay, xem trước rồi tải lên. Mặt Tranh phong cảnh và Tranh · lịch xé thay được ảnh riêng nếu firmware hỗ trợ.
- Nội dung: lời nhắn tiếng Việt, sự kiện đếm ngược, việc cần làm — chỉ hiện chức năng mà firmware có hỗ trợ.
- Thiết lập: cài/kiểm tra tài nguyên; gói đúng đã có sẽ được giữ lại. Nhật ký và công cụ nâng cao nằm ở đây.

## Giới hạn / tương thích

- Nhánh AHT30 V48–V54: tự chọn bộ font và số mặt theo firmware; giữ kênh cài nhanh V54, xác nhận từng khối và kiểm tra CRC của Web V47.
- Nhánh Flash 4.2 V100–V109: giữ giao thức, bộ chữ, tranh mẫu, ảnh nền riêng và dữ liệu sự kiện.
- Nhánh giao thức cũ / 7.5: giữ đường tương thích Đồng hồ 1 / 2 và tải ảnh như V47. Không giả định bố cục giống AHT30. Khuyến nghị thiết bị cũ tiếp tục dùng trang cũ theo cách phát hành riêng của chủ thiết bị.
- Màn UC8159 giữ bộ mã hóa ảnh 640×384; không đổi thành 480×800. Kích thước và kiểu quét khác vẫn có trong mục ảnh để tương thích các thiết bị có sẵn.
- Không tự kết nối lại, không tự chọn mặt và không tự cài dữ liệu khi vừa kết nối.
- Ảnh thư viện là ảnh kết xuất firmware tham khảo; ngày giờ thực tế và một số bản sửa nhỏ có thể khác.
- Giao diện web không thay đổi LUT, lịch tô màu, cảm biến hoặc logic firmware.

## Xác minh

Kiểm tra tự động giao thức mô phỏng và Chrome desktop/mobile được lưu trong thư mục nguồn `web_v48`. Đây không thay thế kiểm tra BLE thật, Bluefy trên iPhone hoặc thử trên màn hình phần cứng.
