package com.reusehub.backend.config;

import com.reusehub.auth.ratelimit.AuthRateLimitInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class AuthRateLimitConfig implements WebMvcConfigurer {

    private final AuthRateLimitInterceptor authRateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authRateLimitInterceptor)
                .addPathPatterns(
                        "/api/auth/registrar",
                        "/api/auth/reativar-conta",
                        "/api/auth/minha-conta",
                        "/api/auth/minha-conta/desativar"
                );
    }
}
