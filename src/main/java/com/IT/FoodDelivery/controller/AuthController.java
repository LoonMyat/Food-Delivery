package com.IT.FoodDelivery.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.service.UserService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@Controller
@AllArgsConstructor
public class AuthController {

    private final UserService userService;

    @GetMapping("/login")
    public String register(Model model) {
        AppUser user = new AppUser();
        model.addAttribute("user", user);

        return "login";
    }

    // @PostMapping("/register")
    // public String saveUser(@Valid @ModelAttribute("user") AppUser user,
    // BindingResult result, Model model){
    // String nameError = userService.validateUsername(user.getUsername());
    // String emailError = userService.validateEmail(user.getEmail());
    // String pwdError = userService.validatePassword(user.getPassword());
    // boolean hasError = false;

    // if(nameError!=null){
    // model.addAttribute("nameError", nameError);
    // hasError = true;
    // }
    // if(emailError!=null){
    // model.addAttribute("emailError", emailError);
    // hasError = true;
    // }
    // if(pwdError!=null){
    // model.addAttribute("passwordError", pwdError);
    // hasError = true;
    // }
    // if(hasError){
    // model.addAttribute("showSignup", true);
    // return "login";
    // }

    // userService.register(user);
    // return "redirect:/login";

    // }

    // @GetMapping("/login")
    // public String login(){
    // return "login";
    // }
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerUser(@RequestBody AppUser user) {
        Map<String, Object> response = new HashMap<>();

        // 1. Validation error များကို သီးခြားစီ စစ်ဆေးမည်
        String nameError = userService.validateUsername(user.getUsername());
        String emailError = userService.validateEmail(user.getEmail());
        String pwdError = userService.validatePassword(user.getPassword());

        boolean hasError = false;

        // 2. Error ရှိသမျှကို Map ထဲ ပေါင်းထည့်မည် (else if မသုံးပါ)
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

        // 3. Error အနည်းဆုံး တစ်ခုရှိခဲ့ပါက badRequest (400) ပြန်မည်
        if (hasError) {
            response.put("success", false);
            return ResponseEntity.badRequest().body(response);
        }

        // 4. Error မရှိပါက Database ထဲ သိမ်းပြီး Success ပြန်မည်
        userService.register(user); // User သိမ်းသည့် logic ထည့်ရန် မမေ့ပါနှင့်

        response.put("success", true);
        response.put("message", "Registration successful!");
        return ResponseEntity.ok(response);
    }

}
