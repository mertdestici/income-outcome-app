package com.incomeoutcome.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
@RequiredArgsConstructor
@Slf4j
public class S3StorageService implements StorageService {

    private final S3Client s3Client;

    @Value("${app.storage.bucket}")
    private String bucket;

    @Override
    public String store(MultipartFile file, UUID userId) throws IOException {
        String extension = getExtension(file.getOriginalFilename());
        String key = userId + "/" + UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(file.getContentType())
                        .build(),
                RequestBody.fromInputStream(file.getInputStream(), file.getSize())
        );

        log.info("Stored file to S3: {}/{}", bucket, key);
        return key;
    }

    @Override
    public Resource load(String storageKey) {
        var response = s3Client.getObject(
                GetObjectRequest.builder().bucket(bucket).key(storageKey).build()
        );
        return new InputStreamResource(response);
    }

    @Override
    public void delete(String storageKey) {
        s3Client.deleteObject(
                DeleteObjectRequest.builder().bucket(bucket).key(storageKey).build()
        );
        log.info("Deleted file from S3: {}/{}", bucket, storageKey);
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
