package com.sportslobby.files.api;

import com.sportslobby.files.application.LocalObjectStorageService;
import com.sportslobby.files.application.LocalObjectStorageService.DownloadedObject;
import com.sportslobby.files.persistence.FileRepository;
import java.time.Clock;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@RestController
@ConditionalOnProperty(prefix = "app.files", name = "provider", havingValue = "local", matchIfMissing = true)
@RequestMapping("/api/v1/files/local")
public class LocalFileTransferController {
    private final LocalObjectStorageService objectStorageService;
    private final FileRepository fileRepository;
    private final Clock clock;

    public LocalFileTransferController(
        LocalObjectStorageService objectStorageService,
        FileRepository fileRepository,
        Clock clock
    ) {
        this.objectStorageService = objectStorageService;
        this.fileRepository = fileRepository;
        this.clock = clock;
    }

    @PutMapping("/uploads/{token}")
    public ResponseEntity<Void> upload(
        @PathVariable String token,
        @RequestHeader(HttpHeaders.CONTENT_TYPE) String contentType,
        @RequestBody byte[] content
    ) {
        UUID fileId = objectStorageService.acceptUpload(token, contentType, content);
        fileRepository.markUploaded(fileId, clock.instant());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/downloads/{token}")
    public ResponseEntity<byte[]> download(@PathVariable String token) {
        DownloadedObject download = objectStorageService.readDownload(token);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(download.contentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFileName(download.fileName()) + "\"")
            .header("X-Content-Type-Options", "nosniff")
            .body(download.content());
    }

    private String safeFileName(String fileName) {
        return fileName.replaceAll("[\\r\\n\\\"]", "_");
    }
}
