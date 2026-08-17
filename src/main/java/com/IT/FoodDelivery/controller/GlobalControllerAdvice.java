package com.IT.FoodDelivery.controller;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.repo.UserRepo;

import lombok.AllArgsConstructor;

import java.security.Principal;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
@AllArgsConstructor
public class GlobalControllerAdvice {

    private final UserRepo userRepo;

    @ModelAttribute("user")
    public AppUser getCurrentUser(Principal principal){
        if(principal != null){
            return userRepo.findByEmail(principal.getName()).orElse(null);
        }
        return null;
    } 

}
