package com.incomeoutcome.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "app.storage")
@Getter
@Setter
public class StorageConfig {

    private String uploadDir;
    private int maxFileSizeMb;
    private List<String> allowedTypes;

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(Path.of(uploadDir));
    }
}
