package com.IT.FoodDelivery.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileUploadService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String saveFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // 1. Folder မရှိသေးရင် အလိုအလျောက် ဆောက်ပေးမည်
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        // 2. File Name မတူအောင် UUID သုံးမည် (ဥပမာ - 1689000_a1b2c3-photo.jpg)
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        String newFilename = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + fileExtension;

        // 3. Folder ထဲသို့ File ကို ကူးယူမည်
        Path targetPath = Paths.get(uploadDir).resolve(newFilename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // 4. Database ထဲ သိမ်းရန် File Name သာ ပြန်ပေးမည်
        return newFilename;
    }
}