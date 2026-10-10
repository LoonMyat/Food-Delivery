package com.IT.FoodDelivery.controller;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public String handleGeneralException(Exception ex, Model model) {
        ex.printStackTrace();
        
        return "error/error"; 
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public String handleAccessDeniedException(AccessDeniedException ex, Model model) {
        return "redirect:/login?access_denied"; 
    }

    @ExceptionHandler(RiderNotFoundException.class)
    public String handleRiderNotFound(RiderNotFoundException ex) {
        return "redirect:/login?rider_removed=true";
    }
}
