package com.IT.FoodDelivery.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.IT.FoodDelivery.service.CustomUserDetailsService;

import lombok.AllArgsConstructor;

@Configuration
@EnableWebSecurity
@AllArgsConstructor
public class WebSecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final LoginSuccessHandler loginSuccessHandler;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**", "/register", "/login"))
                .authenticationProvider(authenticationProvider())
                .authorizeHttpRequests(auth -> {
                    auth
                            .requestMatchers("/register", "/login", "/api/login", "/api/register", "/css/**", "/js/**",
                                    "/images/**", "/uploads/**")
                            .permitAll()
                            .requestMatchers("/admin/**").hasRole("ADMIN")
                            .requestMatchers("/customer/**").hasRole("CUSTOMER")
                            .requestMatchers("/rider/**").hasRole("RIDER")
                            .anyRequest()
                            .authenticated();
                })
                .formLogin(httpForm -> {
                    httpForm
                            .loginPage("/login")
                            .loginProcessingUrl("/login")
                            .usernameParameter("loginEmail")
                            .passwordParameter("loginPass")
                            .successHandler(loginSuccessHandler)
                            .permitAll();
                })
                .rememberMe(remember -> {
                    remember
                            .key("uniqueAndSecretKeyForMyRestaurantApp")
                            .tokenValiditySeconds(86400 * 7) // ၇ ရက်
                            .alwaysRemember(true)
                            .userDetailsService(customUserDetailsService);

                })
                .logout(logout -> {
                    logout
                            .logoutSuccessUrl("/login");
                })
                .build();
    }

}
