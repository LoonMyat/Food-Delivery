package com.IT.FoodDelivery.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.IT.FoodDelivery.model.Menu;
import com.IT.FoodDelivery.repo.MenuRepo;

import lombok.Data;

@Service
@Data
public class CustomerService {

    private final MenuRepo menuRepo;

    public List<Menu> search(String word){
        if (word == null || word.trim().isEmpty()) {
        return new ArrayList<>();
    }

        return menuRepo.findByNameExactWord(word);
    }

}
