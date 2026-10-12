package com.IT.FoodDelivery.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import com.IT.FoodDelivery.repo.UserRepo;

@Component
public class AccountCheckFilter extends OncePerRequestFilter {

    private final UserRepo userRepo;

    public AccountCheckFilter(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String email = auth.getName();
            
            boolean exists = userRepo.existsByEmail(email); 
            
            if (!exists) {
                request.getSession().invalidate();
                SecurityContextHolder.clearContext();
                
                response.sendRedirect("/login?error=account_deleted");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
}