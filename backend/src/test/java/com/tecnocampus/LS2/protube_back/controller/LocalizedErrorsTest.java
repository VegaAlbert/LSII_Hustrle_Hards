package com.tecnocampus.LS2.protube_back.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * i18n: error messages follow the Accept-Language header (English, Spanish or Catalan), English otherwise.
 */
@SpringBootTest({
        "pro_tube.store.dir=c:",
        "pro_tube.load_initial_data=false"
})
@AutoConfigureMockMvc
@Transactional
class LocalizedErrorsTest {

    private static final String INVALID_REGISTER = """
            {"username": "alice", "email": "not-an-email", "password": "short"}
            """;

    private static final String BAD_LOGIN = """
            {"username": "nobody", "password": "wrong-password"}
            """;

    @Autowired
    MockMvc mockMvc;

    private MockHttpServletRequestBuilder register(String language) {
        MockHttpServletRequestBuilder request = post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(INVALID_REGISTER);
        return language == null ? request : request.header(HttpHeaders.ACCEPT_LANGUAGE, language);
    }

    @Test
    void validationErrorsAreInEnglishWithoutHeader() throws Exception {
        mockMvc.perform(register(null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid data"))
                .andExpect(jsonPath("$.fieldErrors.password").value("Password must be between 8 and 72 characters"))
                .andExpect(jsonPath("$.fieldErrors.email").value("Email is not valid"));
    }

    @Test
    void validationErrorsAreInSpanish() throws Exception {
        mockMvc.perform(register("es"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Datos no válidos"))
                .andExpect(jsonPath("$.fieldErrors.password").value("La contraseña debe tener entre 8 y 72 caracteres"))
                .andExpect(jsonPath("$.fieldErrors.email").value("El correo electrónico no es válido"));
    }

    @Test
    void validationErrorsAreInCatalanAlsoWithARegion() throws Exception {
        mockMvc.perform(register("ca-ES,ca;q=0.9,en;q=0.8"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Dades no vàlides"))
                .andExpect(jsonPath("$.fieldErrors.password").value("La contrasenya ha de tenir entre 8 i 72 caràcters"))
                .andExpect(jsonPath("$.fieldErrors.email").value("El correu electrònic no és vàlid"));
    }

    @Test
    void unsupportedLanguagesFallBackToEnglish() throws Exception {
        mockMvc.perform(register("fr"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.password").value("Password must be between 8 and 72 characters"));
    }

    @Test
    void parameterConstraintsAreTranslated() throws Exception {
        mockMvc.perform(get("/api/videos").param("size", "0").header(HttpHeaders.ACCEPT_LANGUAGE, "es"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Parámetros no válidos"))
                .andExpect(jsonPath("$.fieldErrors.size").value("El tamaño debe estar entre 1 y 50"));
    }

    @Test
    void serviceErrorsAreTranslated() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BAD_LOGIN)
                        .header(HttpHeaders.ACCEPT_LANGUAGE, "ca"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Nom d'usuari o contrasenya incorrectes"));
    }

    @Test
    void serviceErrorsWithArgumentsAreTranslated() throws Exception {
        mockMvc.perform(get("/api/videos/987654").header(HttpHeaders.ACCEPT_LANGUAGE, "ca"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No s'ha trobat el vídeo 987654"));

        mockMvc.perform(get("/api/videos/987654").header(HttpHeaders.ACCEPT_LANGUAGE, "es"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No se ha encontrado el vídeo 987654"));
    }
}
