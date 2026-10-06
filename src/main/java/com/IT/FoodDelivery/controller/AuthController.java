package com.IT.FoodDelivery.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.service.UserService;

import lombok.AllArgsConstructor;

@Controller
@AllArgsConstructor
public class AuthController {

    private final UserService userService;

    @GetMapping("/login")
    public String showLoginPage() {
        return "login";
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerUser(@RequestBody AppUser user) {
        Map<String, Object> response = new HashMap<>();

        // 1. Validation error များကို သီးခြားစီ စစ်ဆေးမည်
        String nameError = userService.validateUsername(user.getUsername());
        String emailError = userService.validateEmail(user.getEmail());
        String pwdError = userService.validatePassword(user.getPassword());

        boolean hasError = false;

        if (nameError != null) {
            response.put("nameError", nameError);
            hasError = true;
        }
        if (emailError != null) {
            response.put("emailError", emailError);
            hasError = true;
        }
        if (pwdError != null) {
            response.put("pwdError", pwdError);
            hasError = true;
        }

        if (hasError) {
            response.put("success", false);
            return ResponseEntity.badRequest().body(response);
        }

        userService.register(user);

        response.put("success", true);
        response.put("message", "Registration successful!");
        return ResponseEntity.ok(response);
    }

}
