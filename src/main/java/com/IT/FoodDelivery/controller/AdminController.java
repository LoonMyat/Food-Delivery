package com.IT.FoodDelivery.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.model.Menu;
import com.IT.FoodDelivery.repo.MenuRepo;
import com.IT.FoodDelivery.repo.UserRepo;
import com.IT.FoodDelivery.service.FileUploadService;

import lombok.AllArgsConstructor;

@Controller
@RequestMapping("/admin")
@AllArgsConstructor
public class AdminController {
    private final FileUploadService fileUploadService;
    private final MenuRepo menuRepo;
    private final UserRepo userRepo;

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
    public String customerList(Model model){
        List<AppUser> customers = userRepo.findByRole("CUSTOMER");
        model.addAttribute("customers", customers);

        return "admin/customer_list";
    }

    @GetMapping("/menu_list")
    public String menuList(Model model){
        List<Menu> foods = menuRepo.findByType("Food");
        List<Menu> drinks = menuRepo.findByType("Drink");
        model.addAttribute("foods", foods);
        model.addAttribute("drinks", drinks);

        return "admin/menu_list";
    }

    @GetMapping("/rider_list")
    public String riderList(){
        return "admin/rider_list";
    }
    
    @GetMapping("/add_rider")
    public String addRider(){
        return "admin/add_rider";
    }

    @GetMapping("/add_menu")
    public String addMenu(){
        return "admin/add_menu";
    }

    @PostMapping("/add_menu")
    public String addMenu(
        @RequestParam(value="name", required=true) String name,
        @RequestParam(value="price", required=true) double price,
        @RequestParam(value="image", required = true) MultipartFile image,
        @RequestParam(value="type", required = true) String type
    ){
        try{
            Menu menu = new Menu();
            menu.setName(name);
            menu.setPrice(price);
            menu.setType(type);
            if(image != null && !image.isEmpty()){
                String savedFileName = fileUploadService.saveFile(image);
                
                // Database ထဲတွင် "/uploads/filename.jpg" ဟု သိမ်းမည်
                menu.setImage("/uploads/" + savedFileName);
            }
            menuRepo.save(menu);

            return "redirect:/admin/menu_list";

        }catch(IOException e){
            e.printStackTrace();
            return "redirect:/admin/add_menu";
        }

    }

    @GetMapping("/notification")
    public String noti(){
        return "admin/notification";
    }

}
