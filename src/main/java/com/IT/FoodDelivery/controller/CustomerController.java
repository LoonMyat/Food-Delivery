package com.IT.FoodDelivery.controller;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.model.Menu;
import com.IT.FoodDelivery.model.Order;
import com.IT.FoodDelivery.repo.MenuRepo;
import com.IT.FoodDelivery.repo.OrderRepo;
import com.IT.FoodDelivery.repo.UserRepo;
import com.IT.FoodDelivery.service.CustomerService;

import lombok.AllArgsConstructor;

@Controller
@RequestMapping("/customer")
@AllArgsConstructor
public class CustomerController {
    private final UserRepo userRepo;
    private final MenuRepo menuRepo;
    private final CustomerService customerService;
    private final OrderRepo orderRepo;

    @GetMapping("/home")
    public String customer(Model model) {
        List<Menu> menus = menuRepo.findAll();
        // List<Menu> randomMenus = new ArrayList<>();
        Set<Menu> randomMenus = new HashSet<>();
        for(Menu menu: menus){
            if(menu.getId() % 3 == 0)
            randomMenus.add(menu);
        }
        model.addAttribute("menus", randomMenus);

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

    @GetMapping("/map")
    public String map(Model model, Authentication auth) {
        String email = auth.getName();
        AppUser customer = userRepo.findByEmail(email).orElseThrow();
        model.addAttribute("customer", customer);
        return "customer/map";
    }

    @GetMapping("/searchFood")
    public String search(@RequestParam("keyword") String keyword, Model model){
        List<Menu> result = customerService.search(keyword);
        model.addAttribute("result", result);
        model.addAttribute("keyword", keyword);

        return "customer/search";
    }

    @GetMapping("/orders/{userId}")
    public String orders(@PathVariable("userId") Long id, Model model){
        AppUser user = userRepo.findById(id).orElse(null);
        if(user != null){
            String name = user.getUsername();
            List<Order> orders = orderRepo.findByCusName(name);
            model.addAttribute("orders", orders);
        }
        return "customer/orders";
    }

}
