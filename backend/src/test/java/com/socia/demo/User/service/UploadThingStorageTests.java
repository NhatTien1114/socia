package com.socia.demo.User.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

class UploadThingStorageTests {
    MockMultipartFile png() throws Exception {
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(800, 400, BufferedImage.TYPE_INT_RGB), "png", bytes);
        return new MockMultipartFile("avatar", "photo.png", "image/png", bytes.toByteArray());
    }
    @Test void validatesRealImageBytesAndResizesBeforeUploading() throws Exception {
        byte[] normalized = UploadThingStorage.normalizeImage(png());
        var image = ImageIO.read(new java.io.ByteArrayInputStream(normalized));
        assertThat(image.getWidth()).isEqualTo(512);
        assertThat(image.getHeight()).isEqualTo(256);
        assertThatThrownBy(() -> UploadThingStorage.normalizeImage(
                new MockMultipartFile("avatar", "fake.png", "image/png", "not an image".getBytes())))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> UploadThingStorage.normalizeImage(
                new MockMultipartFile("avatar", "file.svg", "image/svg+xml", "<svg/>".getBytes())))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> UploadThingStorage.normalizeImage(
                new MockMultipartFile("avatar", "large.png", "image/png", new byte[4 * 1024 * 1024 + 1])))
                .isInstanceOf(ResponseStatusException.class);
    }
    @Test void missingTokenFailsWithoutCallingProvider() throws Exception {
        var http = mock(HttpClient.class);
        assertThatThrownBy(() -> new UploadThingStorage(new ObjectMapper(), "", http).upload(png()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("503");
        verifyNoInteractions(http);
    }
    @Test @SuppressWarnings("unchecked") void followsPrepareThenMultipartPutAndReturnsUfsUrl() throws Exception {
        var http = mock(HttpClient.class);
        HttpResponse<String> prepared = mock(HttpResponse.class), uploaded = mock(HttpResponse.class);
        when(prepared.statusCode()).thenReturn(200);
        when(prepared.body()).thenReturn("{\"key\":\"file-key\",\"url\":\"https://sea1.ingest.uploadthing.com/file-key?signature=test\"}");
        when(uploaded.statusCode()).thenReturn(200);
        when(uploaded.body()).thenReturn("{\"ufsUrl\":\"https://app.ufs.sh/f/file-key\"}");
        when(http.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(prepared, uploaded);
        String token = Base64.getEncoder().encodeToString("{\"apiKey\":\"test-secret\"}".getBytes(StandardCharsets.UTF_8));
        String url = new UploadThingStorage(new ObjectMapper(), token, http).upload(png());
        assertThat(url).isEqualTo("https://app.ufs.sh/f/file-key");
        var requests = ArgumentCaptor.forClass(HttpRequest.class);
        verify(http, times(2)).send(requests.capture(), any(HttpResponse.BodyHandler.class));
        var calls = requests.getAllValues();
        assertThat(calls.get(0).uri().toString()).isEqualTo("https://api.uploadthing.com/v7/prepareUpload");
        assertThat(calls.get(0).headers().firstValue("x-uploadthing-api-key")).contains("test-secret");
        assertThat(calls.get(1).method()).isEqualTo("PUT");
        assertThat(calls.get(1).headers().firstValue("Content-Type").orElseThrow()).startsWith("multipart/form-data; boundary=");
        assertThat(calls.get(1).headers().firstValue("x-uploadthing-api-key")).isEmpty();
    }
    @Test @SuppressWarnings("unchecked") void providerFailureDoesNotExposeSecretsOrResponseBody() throws Exception {
        var http = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(401);
        when(response.body()).thenReturn("sensitive provider response");
        when(http.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(response);
        String token = Base64.getEncoder().encodeToString("{\"apiKey\":\"test-secret\"}".getBytes(StandardCharsets.UTF_8));
        assertThatThrownBy(() -> new UploadThingStorage(new ObjectMapper(), token, http).upload(png()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("502")
                .hasMessageNotContaining("test-secret").hasMessageNotContaining("sensitive provider response");
    }
}
