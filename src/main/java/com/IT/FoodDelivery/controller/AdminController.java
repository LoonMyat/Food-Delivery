package com.IT.FoodDelivery.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @GetMapping("/home")
    public String admin(){
        return "admin/home";
    }

    @GetMapping("/order_list")
    public String orderList(){
        return "admin/order_list";
    }

    @GetMapping("/profile")
    public String profile(){
        return "admin/profile";
    }

    @GetMapping("/customer_list")
    public String customerList(){
        return "admin/customer_list";
    }

    @GetMapping("/menu_list")
    public String menuList(){
        return "admin/menu_list";
    }

    @GetMapping("/rider_list")
    public String riderList(){
        return "admin/rider_list";
    }

}
