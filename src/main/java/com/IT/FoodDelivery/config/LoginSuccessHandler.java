package com.IT.FoodDelivery.config;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class LoginSuccessHandler implements AuthenticationSuccessHandler{

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException{
        if(authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))){
            response.sendRedirect("/admin/home");
        }else if(authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_RIDER"))){
            response.sendRedirect("/rider/home");
        }else{
            response.sendRedirect("/customer/home");
        }
    }

}
