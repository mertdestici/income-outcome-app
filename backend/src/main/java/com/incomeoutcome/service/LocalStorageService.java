package com.incomeoutcome.service;

import com.incomeoutcome.config.StorageConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
@RequiredArgsConstructor
public class LocalStorageService implements StorageService {

    private final StorageConfig storageConfig;

    @Override
    public String store(MultipartFile file, UUID userId) throws IOException {
        String extension = getExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);

        Path userDir = Path.of(storageConfig.getUploadDir(), userId.toString());
        Files.createDirectories(userDir);
        Path destination = userDir.resolve(storedName);
        file.transferTo(destination);

        return destination.toAbsolutePath().toString();
    }

    @Override
    public Resource load(String storageKey) throws IOException {
        Resource resource = new UrlResource(Path.of(storageKey).toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new IOException("File not readable: " + storageKey);
        }
        return resource;
    }

    @Override
    public void delete(String storageKey) throws IOException {
        Files.deleteIfExists(Path.of(storageKey));
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
