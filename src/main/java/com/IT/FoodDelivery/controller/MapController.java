package com.IT.FoodDelivery.controller;

import java.util.Map;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class MapController {

    //rider location ကို customer map မှာပြပေး
    @MessageMapping("/rider-location/{orderId}")
    @SendTo("/topic/track/{orderId}")
    public Map<String, Object> updateRiderLocation(
            @DestinationVariable String orderId, 
            Map<String, Object> location) {
            
        System.out.println("Rider Location for Order [" + orderId + "]: " + location);
        return location; // /topic/track/12345 ကို နားထောင်နေသော Customer ထံ ပြန်ပို့ပေးမည်
    }

    //customer location ကို rider map မှာပြပေး
    @MessageMapping("/customer-home/{orderId}")
    @SendTo("/topic/customer-home/{orderId}")
    public Map<String, Object> updateCustomerHome(
            @DestinationVariable String orderId, 
            Map<String, Object> location) {
            
        System.out.println("Customer Home Location for Order [" + orderId + "]: " + location);
        return location; // /topic/customer-home/12345 ကို နားထောင်နေသော Rider ထံ ပြန်ပို့ပေးမည်
    }

}
