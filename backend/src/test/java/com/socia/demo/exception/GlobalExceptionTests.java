package com.socia.demo.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

class GlobalExceptionTests {
    @RestController
    static class FailingController {
        @GetMapping("/database") String database() {
            throw new DataIntegrityViolationException("insert into conversation: conversation_chk_1 violated");
        }
        @GetMapping("/unexpected") String unexpected() throws Exception {
            throw new Exception("private database credentials and SQL");
        }
        @GetMapping("/internal") String internal() {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "private SQL");
        }
        @GetMapping("/validation") String validation() {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Group needs two friends");
        }
    }

    @Test void internalErrorsNeverExposeExceptionMessages() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(new FailingController())
                .setControllerAdvice(new GlobalException()).build();
        for (String path : new String[] {"/database", "/unexpected", "/internal"}) {
            mvc.perform(get(path)).andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("message").value(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage()));
        }
    }

    @Test void expectedValidationErrorsKeepTheirHelpfulMessage() throws Exception {
        MockMvcBuilders.standaloneSetup(new FailingController())
                .setControllerAdvice(new GlobalException()).build()
                .perform(get("/validation")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("message").value("Group needs two friends"));
    }
}
