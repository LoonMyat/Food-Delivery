package com.IT.FoodDelivery.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.repo.UserRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class UserService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    public void register(AppUser user){

        user.setUsername(user.getUsername());
        user.setEmail(user.getEmail());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("CUSTOMER");
        
        userRepo.save(user);

    }

    public List<AppUser> getAll(){
        return userRepo.findAll();
    }

    public String validatePassword(String password){
        if(password.length() < 8){
            return "Password must be at least 8 characters.";
        }
        if(!password.matches(".*[A-Z].*")){
            return "Password must contain at least one uppercase letter.";
        }
        if(!password.matches(".*[a-z].*")){
            return "Password must contain at least one lowercase letter.";
        }
        if(!password.matches(".*\\d.*")){
            return "Password must contain at least one number.";
        }
        if(!password.matches(".*[@#$%^&-+=!].*")){
            return "Password must contain at least one special character.";
        }
        return null;

    }

    public String validateEmail(String email){
        if(userRepo.existsByEmail(email)){
            return "Email already exists";
        }
        if(email.length() == 0){
            return "Email can't be empty";
        }
        return null;
    }

    public String validateUsername(String username){
        if(username.length() == 0){
            return "Username can't be empty";
        }
        return null;
    }

}
