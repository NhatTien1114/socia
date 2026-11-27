package com.socia.demo.Common;

import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Set;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

public final class ImageNormalizer {
    private ImageNormalizer() {}
    private static final long MAX_SIZE = 4 * 1024 * 1024;

    // Read dimensions before decoding; resize and re-encode to strip metadata and embedded content.
    public static byte[] toPng(MultipartFile file, int maxEdge) {
        if (file.isEmpty() || file.getSize() > MAX_SIZE)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh cần có dung lượng từ 1 byte đến 4 MB.");
        if (!Set.of("image/jpeg", "image/png").contains(String.valueOf(file.getContentType())))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn ảnh JPG hoặc PNG.");
        try (var source = file.getInputStream(); var input = ImageIO.createImageInputStream(source)) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new IllegalArgumentException();
            var reader = readers.next();
            try {
                if (!Set.of("JPEG", "PNG").contains(reader.getFormatName().toUpperCase(java.util.Locale.ROOT)))
                    throw new IllegalArgumentException();
                reader.setInput(input);
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 1 || height < 1 || (long) width * height > 16_000_000) throw new IllegalArgumentException();
                BufferedImage original = reader.read(0);
                double scale = Math.min(1.0, (double) maxEdge / Math.max(width, height));
                BufferedImage output = new BufferedImage(Math.max(1, (int) (width * scale)),
                        Math.max(1, (int) (height * scale)), BufferedImage.TYPE_INT_ARGB);
                var graphics = output.createGraphics();
                try {
                    graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                    graphics.drawImage(original, 0, 0, output.getWidth(), output.getHeight(), null);
                } finally { graphics.dispose(); }
                var bytes = new ByteArrayOutputStream();
                ImageIO.write(output, "png", bytes);
                return bytes.toByteArray();
            } finally { reader.dispose(); }
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh không hợp lệ hoặc vượt quá 16 triệu điểm ảnh.");
        }
    }
}
