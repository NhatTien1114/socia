package com.socia.demo.User.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import com.socia.demo.Common.ImageNormalizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@Service
public class UploadThingStorage {
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

    static byte[] normalizeImage(MultipartFile file) {
        return ImageNormalizer.toPng(file, 512);
    }
}
