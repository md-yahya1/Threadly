package com.forumhub;

import com.forumhub.config.JwtTokenProvider;
import com.forumhub.entity.User;
import com.forumhub.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Test
    public void testUserDetailsServiceBeanIsPresentAndNotInMemory() {
        assertThat(userDetailsService).isNotNull();
        assertThat(userDetailsService.getClass().getName()).doesNotContain("InMemoryUserDetailsManager");
    }

    @Test
    public void testRootEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    public void testHealthCheckEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    public void testProtectedEndpointFailsWithoutAuth() throws Exception {
        mockMvc.perform(post("/api/posts"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testProtectedEndpointSucceedsWithValidJwt() throws Exception {
        User testUser = new User();
        testUser.id = 1L;
        testUser.username = "testuser";
        testUser.email = "test@example.com";
        testUser.passwordHash = "hashedpass";

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        String token = tokenProvider.generateToken(1L, "testuser");

        // Requesting protected POST /api/communities with bad body will pass security filter and hit controller (e.g. 400 Bad Request instead of 401/403)
        mockMvc.perform(post("/api/communities")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
