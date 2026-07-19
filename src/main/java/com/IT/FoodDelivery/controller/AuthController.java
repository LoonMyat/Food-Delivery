package com.IT.FoodDelivery.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.service.UserService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@Controller
@AllArgsConstructor
public class AuthController {

    private final UserService userService;

    @GetMapping("/register")
    public String register(Model model){
        AppUser user = new AppUser();
        model.addAttribute("user", user);

        return "register";
    }

    @PostMapping("/register")
    public String saveUser(@Valid @ModelAttribute("user") AppUser user, BindingResult result, Model model){
        String nameError = userService.validateUsername(user.getUsername());
        String emailError = userService.validateEmail(user.getEmail());
        String pwdError = userService.validatePassword(user.getPassword());
        boolean hasError = false;

        if(nameError!=null){
            model.addAttribute("nameError", nameError);
            hasError = true;
        }
        if(emailError!=null){
            model.addAttribute("emailError", emailError);
            hasError = true;
        }
        if(pwdError!=null){
            model.addAttribute("passwordError", pwdError);
            hasError = true;
        }
        if(hasError){
            return "register";
        }
        
        userService.register(user);
        return "redirect:/login";
        
    }

    @GetMapping("/login")
    public String login(){
        return "login";
    }

}
