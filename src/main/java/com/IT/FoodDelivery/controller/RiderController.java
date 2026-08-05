package com.IT.FoodDelivery.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/rider")
public class RiderController {

    @GetMapping("/home")
    public String home(){
        return "rider/home";
    }

    @GetMapping("/orders")
    public String orders(){
        return "rider/orders";
    }

    @GetMapping("/mapTest")
    public String map(){
        return "rider/mapTest";
    }

    @GetMapping("/notifications")
    public String noti(){
        return "rider/notifications";
    }

}
