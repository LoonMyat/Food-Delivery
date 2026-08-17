package com.IT.FoodDelivery.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.model.Menu;
import com.IT.FoodDelivery.repo.MenuRepo;
import com.IT.FoodDelivery.repo.UserRepo;

import lombok.AllArgsConstructor;

@Controller
@RequestMapping("/customer")
@AllArgsConstructor
public class CustomerController {
    private final UserRepo userRepo;
    private final MenuRepo menuRepo;

    @GetMapping("/home")
    public String customer(Model model) {
        List<Menu> menus = menuRepo.findAll();
        model.addAttribute("menus", menus);

        return "customer/home";
    }

    @GetMapping("/cart")
    public String cart() {
        return "customer/cart";
    }

    @GetMapping("/search")
    public String search() {
        return "customer/search";
    }

    @GetMapping("/profile")
    public String profile() {
        return "customer/profile";
    }

    @GetMapping("/menulist")
    public String menulist(Model model) {
        List<Menu> foods = menuRepo.findByType("Food");
        List<Menu> drinks = menuRepo.findByType("Drink");
        
        model.addAttribute("foods", foods);
        model.addAttribute("drinks", drinks);
        return "customer/menulist";
    }

    @GetMapping("/maptest")
    public String map(Model model, Authentication auth) {
        String email = auth.getName();
        AppUser customer = userRepo.findByEmail(email).orElseThrow();
        model.addAttribute("customer", customer);
        return "customer/map";
    }

}
