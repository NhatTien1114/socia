package com.socia.demo.exception;

import java.nio.file.AccessDeniedException;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import lombok.extern.slf4j.Slf4j;
import jakarta.validation.ConstraintViolation;

@ControllerAdvice
@Slf4j
public class GlobalException {

    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse> handleException(Exception e) {
        log.error("Exception: ", e);
        ApiResponse<Object> response = ApiResponse.builder()
                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                .message(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                .build();
        return ResponseEntity.status(ErrorCode.UNCATEGORIZED_EXCEPTION.getStatusCode().value()).body(response);
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    ResponseEntity<ApiResponse> handlingAccessDeniedException(AccessDeniedException exception) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;

        return ResponseEntity.status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception) {
        ErrorCode errorCode = ErrorCode.INVALID_KEY;
        Map<String, Object> attributes = null;

        if (exception.getBindingResult().getAllErrors().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .code(errorCode.getCode())
                    .message(errorCode.getMessage())
                    .build());
        }

        var validationError = exception.getBindingResult().getAllErrors().getFirst();
        try {
            errorCode = ErrorCode.valueOf(validationError.getDefaultMessage());
        } catch (IllegalArgumentException | NullPointerException ignored) {
            // A validation message not mapped to ErrorCode uses the generic response.
        }

        try {
            ConstraintViolation<?> constraintViolation = validationError.unwrap(ConstraintViolation.class);
            attributes = constraintViolation.getConstraintDescriptor().getAttributes();
        } catch (IllegalArgumentException ignored) {
            // Some Spring binding errors are not backed by a Bean Validation constraint.
        }

        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(
                Objects.nonNull(attributes)
                        ? mapAttribute(errorCode.getMessage(), attributes)
                        : errorCode.getMessage());

        return ResponseEntity.badRequest().body(apiResponse);
    }

    private String mapAttribute(String message, Map<String, Object> attributes) {
        String mappedMessage = message;
        for (Map.Entry<String, Object> attribute : attributes.entrySet()) {
            mappedMessage = mappedMessage.replace(
                    "{" + attribute.getKey() + "}",
                    String.valueOf(attribute.getValue()));
        }
        return mappedMessage;
    }
}
