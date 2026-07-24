package com.IT.FoodDelivery.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
public class LoginApiController {

    private final AuthenticationManager authenticationManager;

    public LoginApiController(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/api/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginReq) {
        Map<String, Object> response = new HashMap<>();
        String email = loginReq.get("loginEmail");
        String password = loginReq.get("loginPass");

        try {
            // Spring Security ဖြင့် Authentication စစ်ဆေးခြင်း
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );

            // Session ထဲတွင် User Login ဝင်သွားကြောင်း မှတ်သားခြင်း
            SecurityContextHolder.getContext().setAuthentication(authentication);

            response.put("success", true);
            response.put("redirectUrl", "/home"); // Login အောင်မြင်ပါက သွားမည့် Page
            return ResponseEntity.ok(response);

        } catch (AuthenticationException e) {
            // Login မှားယွင်းပါက Page reload မဖြစ်ဘဲ Error ပြရန်
            response.put("success", false);
            response.put("message", "Invalid email or password");
            return ResponseEntity.badRequest().body(response);
        }
    }
}