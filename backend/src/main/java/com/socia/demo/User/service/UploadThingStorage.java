package com.socia.demo.User.service;

import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@Service
public class UploadThingStorage {
    private static final long MAX_SIZE = 4 * 1024 * 1024;
    private final ObjectMapper json;
    private final String token;
    private final HttpClient http;

    @Autowired
    public UploadThingStorage(ObjectMapper json, @Value("${UPLOADTHING_TOKEN:}") String token) {
        this(json, token, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
    }

    UploadThingStorage(ObjectMapper json, String token, HttpClient http) {
        this.json = json;
        this.token = token;
        this.http = http;
    }

    public String upload(MultipartFile file) {
        byte[] image = normalizeImage(file);
        if (token.isBlank())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa cấu hình dịch vụ ảnh. Vui lòng thử lại sau.");
        String apiKey;
        try {
            apiKey = json.readTree(Base64.getDecoder().decode(token.trim())).path("apiKey").asText("");
            if (apiKey.isBlank()) throw new IllegalArgumentException();
        } catch (Exception exception) {
            // Never return the token, provider response or signed URL in errors/logs.
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Cấu hình dịch vụ ảnh không hợp lệ.");
        }
        try {
            String filename = "avatar-" + UUID.randomUUID() + ".png";
            var prepare = HttpRequest.newBuilder(URI.create("https://api.uploadthing.com/v7/prepareUpload"))
                    .timeout(Duration.ofSeconds(20)).header("Content-Type", "application/json")
                    .header("x-uploadthing-api-key", apiKey)
                    .header("x-uploadthing-be-adapter", "socia-java")
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(Map.of(
                            "fileName", filename, "fileSize", image.length, "fileType", "image/png",
                            "contentDisposition", "inline", "acl", "public-read")))).build();
            var prepared = http.send(prepare, HttpResponse.BodyHandlers.ofString());
            if (prepared.statusCode() != 200) throw new IllegalStateException();
            var signed = json.readTree(prepared.body());
            URI uploadUrl = URI.create(signed.path("url").asText(""));
            if (!trustedUrl(uploadUrl, ".ingest.uploadthing.com")) throw new IllegalStateException();
            String boundary = "socia-" + UUID.randomUUID();
            byte[] head = ("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\""
                    + filename + "\"\r\nContent-Type: image/png\r\n\r\n").getBytes(StandardCharsets.UTF_8);
            byte[] tail = ("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8);
            var upload = HttpRequest.newBuilder(uploadUrl).timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .header("Range", "bytes=0-")
                    .PUT(HttpRequest.BodyPublishers.concat(HttpRequest.BodyPublishers.ofByteArray(head),
                            HttpRequest.BodyPublishers.ofByteArray(image), HttpRequest.BodyPublishers.ofByteArray(tail)))
                    .build();
            var uploaded = http.send(upload, HttpResponse.BodyHandlers.ofString());
            if (uploaded.statusCode() < 200 || uploaded.statusCode() >= 300) throw new IllegalStateException();
            String url = json.readTree(uploaded.body()).path("ufsUrl").asText("");
            if (!trustedUrl(URI.create(url), ".ufs.sh") || url.length() > 2048)
                throw new IllegalStateException();
            return url;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw uploadFailed();
        } catch (Exception exception) {
            throw uploadFailed();
        }
    }

    private static boolean trustedUrl(URI uri, String suffix) {
        return "https".equals(uri.getScheme()) && uri.getHost() != null
                && uri.getHost().endsWith(suffix) && uri.getUserInfo() == null
                && (uri.getPort() == -1 || uri.getPort() == 443);
    }

    private static ResponseStatusException uploadFailed() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không thể tải ảnh lên. Vui lòng thử lại.");
    }

    // Read dimensions before decoding; resize and re-encode to strip metadata and embedded content.
    static byte[] normalizeImage(MultipartFile file) {
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
                double scale = Math.min(1.0, 512.0 / Math.max(width, height));
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
