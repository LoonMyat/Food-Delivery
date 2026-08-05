package com.IT.FoodDelivery.controller;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.repo.UserRepo;

import lombok.AllArgsConstructor;

@Controller
@RequestMapping("/customer")
@AllArgsConstructor
public class CustomerController {
    private final UserRepo userRepo;

    @GetMapping("/home")
    public String customer(){
        return "customer/home";
    }

    @GetMapping("/cart")
    public String cart(){
        return "customer/cart";
    }

    @GetMapping("/search")
    public String search(){
        return "customer/search";
    }

    @GetMapping("/profile")
    public String profile(){
        return "customer/profile";
    }

    @GetMapping("/menulist")
    public String menulist(){
        return "customer/menulist";
    }

    @GetMapping("/maptest")
    public String map(Model model, Authentication auth){
        String email = auth.getName();
        AppUser customer = userRepo.findByEmail(email).orElseThrow();
        model.addAttribute("customer", customer);
        return "customer/map";
    }

}
