package com.IT.FoodDelivery.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.repo.UserRepo;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initAdmin(){
        return args -> {
            String adminEmail = "admin@gmail.com";

            if(!userRepo.existsByEmail(adminEmail)){
                AppUser admin = new AppUser();

                admin.setUsername("admin");
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("ADMIN");
                userRepo.save(admin);
            }
        };
    }

}
