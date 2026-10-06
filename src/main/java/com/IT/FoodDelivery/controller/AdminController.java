package com.IT.FoodDelivery.controller;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.model.Menu;
import com.IT.FoodDelivery.model.Order;
import com.IT.FoodDelivery.model.Rider;
import com.IT.FoodDelivery.repo.MenuRepo;
import com.IT.FoodDelivery.repo.OrderRepo;
import com.IT.FoodDelivery.repo.RiderRepo;
import com.IT.FoodDelivery.repo.UserRepo;
import com.IT.FoodDelivery.service.AdminService;
import com.IT.FoodDelivery.service.FileUploadService;

import lombok.AllArgsConstructor;

@Controller
@RequestMapping("/admin")
@AllArgsConstructor
public class AdminController {
    private final FileUploadService fileUploadService;
    private final MenuRepo menuRepo;
    private final UserRepo userRepo;
    private final RiderRepo riderRepo;
    private final AdminService adminService;
    private final OrderRepo orderRepo;

    @GetMapping("/home")
    public String admin() {
        return "admin/home";
    }

    @GetMapping("/order_list")
    public String orderList(Model model) {
        List<Order> orders = orderRepo.findAll();
        model.addAttribute("orders", orders);
        return "admin/order_list";
    }

    @GetMapping("/profile")
    public String profile() {
        return "admin/profile";
    }

    @GetMapping("/customer_list")
    public String customerList(Model model) {
        List<AppUser> customers = userRepo.findByRole("CUSTOMER");
        model.addAttribute("customers", customers);

        return "admin/customer_list";
    }

    @GetMapping("/menu_list")
    public String menuList(Model model) {
        List<Menu> foods = menuRepo.findByType("Food");
        List<Menu> drinks = menuRepo.findByType("Drink");
        
        model.addAttribute("foods", foods);
        model.addAttribute("drinks", drinks);

        return "admin/menu_list";
    }

    @GetMapping("/rider_list")
    public String riderList(Model model) {
        List<Rider> riders = riderRepo.findAll();
        model.addAttribute("riders", riders);

        return "admin/rider_list";
    }

    @GetMapping("/add_rider")
    public String addRider() {
        return "admin/add_rider";
    }

    @GetMapping("/add_menu")
    public String addMenu() {
        return "admin/add_menu";
    }

    @PostMapping("/add_menu")
    public String addMenu(
            @RequestParam(value = "name", required = true) String name,
            @RequestParam(value = "price", required = true) Double price,
            @RequestParam(value = "image", required = true) MultipartFile image,
            @RequestParam(value = "type", required = true) String type,
            RedirectAttributes redirectAttributes
        ) {
        try {
            Optional<Menu> menuOptional = menuRepo.findByName(name);
            if(!menuOptional.isEmpty()){
                redirectAttributes.addFlashAttribute("errorMessage", "Menu already exit");
                return "redirect:/admin/add_menu";
            }
            Menu menu = new Menu();
            menu.setName(name);
            menu.setPrice(price);
            menu.setType(type);
            if (image != null && !image.isEmpty()) {
                String savedFileName = fileUploadService.saveFile(image);

                // Database ထဲတွင် "/uploads/filename.jpg" ဟု သိမ်းမည်
                menu.setImage("/uploads/" + savedFileName);
            }
            menuRepo.save(menu);

            redirectAttributes.addFlashAttribute("successMessage", "Menu added successfully");

            return "redirect:/admin/menu_list";

        } catch (IOException e) {
            System.err.println(e.getMessage());
            redirectAttributes.addFlashAttribute("errorMessage", "Error while uploading image");
            return "redirect:/admin/add_menu";
        }

    }

    @PostMapping("/add_rider")
    public String add_rider(
            @RequestParam(value = "email", required = true) String email,
            @RequestParam(value = "phno", required = true) String phno,
            RedirectAttributes redirectAttributes
    ) {
        Optional<AppUser> userOptional = userRepo.findByEmail(email);
        if(userOptional.isEmpty()){
            redirectAttributes.addFlashAttribute("errorMessage", "Email does not exist");
            return "redirect:/admin/add_rider";
        }
        AppUser user = userOptional.get();
        if(riderRepo.existsByUser(user)){
            redirectAttributes.addFlashAttribute("errorMessage", "Rider already exists");
            return "redirect:/admin/add_rider";
        }

        user.setRole("RIDER");
        userRepo.save(user);

        Rider rider = new Rider();
        rider.setUser(user);
        rider.setPh_no(phno);
        rider.setUser(user);
        rider.setStatus("AVAILABLE");
        riderRepo.save(rider);

        return "redirect:/admin/rider_list";

    }

    @PostMapping("/deleteRider/{riderId}")
    public String deleteRider(@PathVariable("riderId") Long id){
        adminService.deleteRider(id);
        return "redirect:/admin/rider_list";
    }

    @PostMapping("/deleteUser/{userId}")
    public String deleteUser(@PathVariable("userId") Long id){
        adminService.deleteUser(id);
        return "redirect:/admin/customer_list";
    }

    @GetMapping("/notification")
    public String noti() {
        return "admin/notification";
    }

    @PostMapping("/edit-menu/{id}")
    public String editMenu(
        @PathVariable("id") Long id,
        @RequestParam("fname") String name,
        @RequestParam("fprice") Double price
    ){
        adminService.editMenu(id, name, price);
        return "redirect:/admin/menu_list";
    }

    @PostMapping ("/delete-menu/{id}")
    public String deleteMenu(
        @PathVariable("id") Long id
    ){
        adminService.deleteMenu(id);
        return "redirect:/admin/menu_list";
    }

}
