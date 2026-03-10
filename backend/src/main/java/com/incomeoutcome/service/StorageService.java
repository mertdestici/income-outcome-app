package com.incomeoutcome.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

public interface StorageService {

    /**
     * Store a file and return the storage key (path or S3 key).
     */
    String store(MultipartFile file, UUID userId) throws IOException;

    /**
     * Load a file by its storage key.
     */
    Resource load(String storageKey) throws IOException;

    /**
     * Delete a file by its storage key.
     */
    void delete(String storageKey) throws IOException;
}
