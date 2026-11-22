# Web V50 — cài tài nguyên nhanh cho Flash 4.2 V109R5

Tiếp tục nhận đúng các nhánh như Web V49. Giao diện, ảnh xem trước, điều khiển AHT30, tải ảnh và thay tranh không đổi. Không tự kết nối lại.

- Nạp V109R5 nếu muốn thử tốc độ mới; mở Web V50 bằng HTTPS hoặc localhost trên trình duyệt hỗ trợ Bluetooth.
- Nhận diện vẫn là Flash 4.2, giao thức 109. Nếu đã hiện Tài nguyên sẵn sàng thì không cần cài lại; tài nguyên V109R3/R4 hợp lệ được giữ.
- Trên bo trắng, bấm Cài tài nguyên. Nhật ký ghi kênh nhanh hay có xác nhận. Kênh nhanh chỉ dùng cho các mảnh của bộ tài nguyên chính và gói chữ bổ sung, đợi ACK sau khi thiết bị ghi từng khối. Cuối gói vẫn kiểm CRC.
- Nếu gửi nhanh lỗi, chờ web báo lỗi rồi bấm Cài tài nguyên lại **trong cùng kết nối** để dùng đường có xác nhận. Không tự gửi lại hoặc tự kết nối lại.
- V109R3/R4 vẫn dùng được Web V50 theo đường cũ. V109R5 vẫn dùng được Web V49, nhưng không có đường gửi nhanh mới.

Để thử qua GitHub Pages, chỉ tải `index.html` đã giải nén lên trang thử hoặc repository `/2640/` nếu bạn muốn cập nhật nó. Không tải HEX hoặc ZIP lên. Gói này chưa được xuất bản.
