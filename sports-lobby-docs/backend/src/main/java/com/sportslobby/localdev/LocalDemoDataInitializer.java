package com.sportslobby.localdev;

import com.sportslobby.files.application.FileStorageProperties;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("local")
@ConditionalOnProperty(prefix = "app.demo-data", name = "enabled", havingValue = "true")
public class LocalDemoDataInitializer implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(LocalDemoDataInitializer.class);
    private static final String DEMO_PASSWORD = "Demo123!";
    private static final String ADMIN_PASSWORD = "Admin123!";

    private static final UUID ADMIN_USER_ID = id("20000000-0000-0000-0000-000000000001");
    private static final UUID PLAYER_USER_ID = id("20000000-0000-0000-0000-000000000002");
    private static final UUID VENDOR_USER_ID = id("20000000-0000-0000-0000-000000000003");
    private static final UUID PENDING_VENDOR_USER_ID = id("20000000-0000-0000-0000-000000000004");
    private static final List<UUID> GUEST_USER_IDS = List.of(
        id("20000000-0000-0000-0000-000000000011"),
        id("20000000-0000-0000-0000-000000000012"),
        id("20000000-0000-0000-0000-000000000013"),
        id("20000000-0000-0000-0000-000000000014"),
        id("20000000-0000-0000-0000-000000000015"),
        id("20000000-0000-0000-0000-000000000016")
    );

    private static final UUID APPROVED_VENDOR_ID = id("30000000-0000-0000-0000-000000000001");
    private static final UUID PENDING_VENDOR_ID = id("30000000-0000-0000-0000-000000000002");
    private static final UUID APPROVED_SUBMISSION_ID = id("31000000-0000-0000-0000-000000000001");
    private static final UUID PENDING_SUBMISSION_ID = id("31000000-0000-0000-0000-000000000002");

    private static final UUID FOOTBALL_IMAGE_ID = id("40000000-0000-0000-0000-000000000001");
    private static final UUID BASKETBALL_IMAGE_ID = id("40000000-0000-0000-0000-000000000002");
    private static final UUID PADEL_IMAGE_ID = id("40000000-0000-0000-0000-000000000003");
    private static final UUID LICENSE_FILE_ID = id("40000000-0000-0000-0000-000000000011");
    private static final UUID LOGO_FILE_ID = id("40000000-0000-0000-0000-000000000012");
    private static final UUID FACILITY_FILE_ID = id("40000000-0000-0000-0000-000000000013");

    private static final UUID FOOTBALL_VENUE_ID = id("50000000-0000-0000-0000-000000000001");
    private static final UUID BASKETBALL_VENUE_ID = id("50000000-0000-0000-0000-000000000002");
    private static final UUID PADEL_VENUE_ID = id("50000000-0000-0000-0000-000000000003");
    private static final UUID FOOTBALL_COURT_ID = id("60000000-0000-0000-0000-000000000001");
    private static final UUID BASKETBALL_COURT_ID = id("60000000-0000-0000-0000-000000000002");
    private static final UUID PADEL_COURT_ID = id("60000000-0000-0000-0000-000000000003");
    private static final UUID FOOTBALL_LOBBY_ID = id("70000000-0000-0000-0000-000000000001");
    private static final UUID BASKETBALL_LOBBY_ID = id("70000000-0000-0000-0000-000000000002");
    private static final UUID PADEL_LOBBY_ID = id("70000000-0000-0000-0000-000000000003");

    private static final UUID FOOTBALL_SPORT_ID = id("10000000-0000-0000-0000-000000000001");
    private static final UUID BASKETBALL_SPORT_ID = id("10000000-0000-0000-0000-000000000002");
    private static final UUID PADEL_SPORT_ID = id("10000000-0000-0000-0000-000000000005");

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageProperties fileProperties;
    private final Clock clock;
    private UUID adminUserId = ADMIN_USER_ID;
    private UUID playerUserId = PLAYER_USER_ID;
    private UUID vendorUserId = VENDOR_USER_ID;
    private UUID pendingVendorUserId = PENDING_VENDOR_USER_ID;
    private List<UUID> guestUserIds = GUEST_USER_IDS;

    public LocalDemoDataInitializer(
        JdbcTemplate jdbcTemplate,
        PasswordEncoder passwordEncoder,
        FileStorageProperties fileProperties,
        Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.fileProperties = fileProperties;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!"local".equals(fileProperties.provider())) {
            log.warn("Skipping local demo data because app.files.provider is not local.");
            return;
        }

        Instant now = clock.instant();
        seedUsers(now);
        seedVendors(now);
        seedFiles(now);
        seedVenuesAndCourts(now);
        seedLobbiesAndReservations(now);
        log.info("Local demo data is ready. Player {}, vendor {}, pending vendor {}, admin {}.",
            "+962790000001", "+962790000002", "+962790000003", "+962799999999");
    }

    private void seedUsers(Instant now) {
        String demoPasswordHash = passwordEncoder.encode(DEMO_PASSWORD);
        adminUserId = seedUser(ADMIN_USER_ID, "Admin", "User", "admin@sports-lobby.local", "+962799999999", passwordEncoder.encode(ADMIN_PASSWORD), now);
        seedRole(adminUserId, "ADMIN");

        playerUserId = seedUser(PLAYER_USER_ID, "Omar", "Khalil", "player@sports-lobby.local", "+962790000001", demoPasswordHash, now);
        seedRole(playerUserId, "PLAYER");
        seedPlayerProfile(playerUserId, "Omar Khalil", "Amman");

        vendorUserId = seedUser(VENDOR_USER_ID, "Lina", "Haddad", "vendor@sports-lobby.local", "+962790000002", demoPasswordHash, now);
        seedRole(vendorUserId, "VENDOR");

        pendingVendorUserId = seedUser(PENDING_VENDOR_USER_ID, "Yazan", "Saleh", "pending-vendor@sports-lobby.local", "+962790000003", demoPasswordHash, now);
        seedRole(pendingVendorUserId, "VENDOR");

        List<UUID> resolvedGuestIds = new ArrayList<>();
        for (int index = 0; index < GUEST_USER_IDS.size(); index++) {
            int number = index + 1;
            UUID userId = seedUser(
                GUEST_USER_IDS.get(index),
                "Demo",
                "Player " + number,
                "demo-player-" + number + "@sports-lobby.local",
                "+9627800000" + (10 + number),
                null,
                now
            );
            resolvedGuestIds.add(userId);
            seedRole(userId, "PLAYER");
            seedPlayerProfile(userId, "Demo Player " + number, "Amman");
        }
        guestUserIds = List.copyOf(resolvedGuestIds);
    }

    private UUID seedUser(
        UUID id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String passwordHash,
        Instant now
    ) {
        UUID resolvedId = jdbcTemplate.query(
            "SELECT id FROM users WHERE phone_e164 = ? OR LOWER(email) = LOWER(?) ORDER BY CASE WHEN phone_e164 = ? THEN 0 ELSE 1 END LIMIT 1",
            (rs, rowNum) -> rs.getObject("id", UUID.class),
            phone,
            email,
            phone
        ).stream().findFirst().orElse(id);
        jdbcTemplate.update(
            """
            INSERT INTO users (
                id, first_name, last_name, email, phone_e164, phone_verified_at,
                password_hash, status, preferred_locale, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'en', ?, ?)
            ON CONFLICT (id) DO UPDATE SET
                first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
                email = EXCLUDED.email, phone_e164 = EXCLUDED.phone_e164,
                phone_verified_at = EXCLUDED.phone_verified_at,
                password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
                status = 'ACTIVE', updated_at = EXCLUDED.updated_at
            """,
            resolvedId, firstName, lastName, email, phone, timestamp(now), passwordHash, timestamp(now), timestamp(now)
        );
        return resolvedId;
    }

    private void seedRole(UUID userId, String role) {
        jdbcTemplate.update(
            "INSERT INTO user_roles (user_id, role) VALUES (?, ?) ON CONFLICT (user_id, role) DO NOTHING",
            userId,
            role
        );
    }

    private void seedPlayerProfile(UUID userId, String displayName, String city) {
        jdbcTemplate.update(
            """
            INSERT INTO player_profiles (user_id, display_name, home_country_code, home_city)
            VALUES (?, ?, 'JO', ?)
            ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, home_city = EXCLUDED.home_city
            """,
            userId,
            displayName,
            city
        );
    }

    private void seedVendors(Instant now) {
        seedVendor(
            APPROVED_VENDOR_ID, vendorUserId, "PlayHub Jordan", "+962790000002",
            "vendor@sports-lobby.local", "Amman", "Abdoun", "Zahran Street, Amman",
            "Football,Basketball,Padel", "APPROVED", now
        );
        seedVendor(
            PENDING_VENDOR_ID, pendingVendorUserId, "Future Sports Club", "+962790000003",
            "pending-vendor@sports-lobby.local", "Amman", "Khalda", "Wasfi Al Tal Street, Amman",
            "Football,Tennis", "PENDING", now
        );
        seedVendorMember(APPROVED_VENDOR_ID, vendorUserId);
        seedVendorMember(PENDING_VENDOR_ID, pendingVendorUserId);
        seedSubmission(APPROVED_SUBMISSION_ID, APPROVED_VENDOR_ID, "APPROVED", 1, now, adminUserId);
        seedSubmission(PENDING_SUBMISSION_ID, PENDING_VENDOR_ID, "PENDING", 1, now, null);
    }

    private void seedVendor(
        UUID id,
        UUID ownerId,
        String businessName,
        String phone,
        String email,
        String city,
        String area,
        String address,
        String sports,
        String status,
        Instant now
    ) {
        jdbcTemplate.update(
            """
            INSERT INTO vendors (
                id, owner_user_id, business_name, contact_phone, contact_email,
                country_code, city, area, address_line, supported_sports,
                venue_count_estimate, opening_hours, verification_status, approved_at,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'JO', ?, ?, ?, ?, 3, 'Daily 08:00-23:00', ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
                business_name = EXCLUDED.business_name, contact_phone = EXCLUDED.contact_phone,
                contact_email = EXCLUDED.contact_email, city = EXCLUDED.city, area = EXCLUDED.area,
                address_line = EXCLUDED.address_line, supported_sports = EXCLUDED.supported_sports,
                verification_status = EXCLUDED.verification_status, approved_at = EXCLUDED.approved_at,
                status_reason = NULL, updated_at = EXCLUDED.updated_at
            """,
            id, ownerId, businessName, phone, email, city, area, address, sports, status,
            "APPROVED".equals(status) ? timestamp(now) : null, timestamp(now), timestamp(now)
        );
    }

    private void seedVendorMember(UUID vendorId, UUID userId) {
        jdbcTemplate.update(
            """
            INSERT INTO vendor_members (vendor_id, user_id, member_role, status)
            VALUES (?, ?, 'OWNER', 'ACTIVE')
            ON CONFLICT (vendor_id, user_id) DO UPDATE SET member_role = 'OWNER', status = 'ACTIVE'
            """,
            vendorId,
            userId
        );
    }

    private void seedSubmission(
        UUID id,
        UUID vendorId,
        String status,
        int number,
        Instant now,
        UUID reviewedBy
    ) {
        boolean approved = "APPROVED".equals(status);
        String businessName = approved ? "PlayHub Jordan" : "Future Sports Club";
        String phone = approved ? "+962790000002" : "+962790000003";
        String email = approved ? "vendor@sports-lobby.local" : "pending-vendor@sports-lobby.local";
        String area = approved ? "Abdoun" : "Khalda";
        String address = approved ? "Zahran Street, Amman" : "Wasfi Al Tal Street, Amman";
        jdbcTemplate.update(
            """
            INSERT INTO vendor_verification_submissions (
                id, vendor_id, status, submitted_at, reviewed_at, reviewed_by_admin_user_id,
                decision_reason, submission_number, business_name_snapshot, contact_phone_snapshot,
                contact_email_snapshot, country_code_snapshot, city_snapshot, area_snapshot,
                address_line_snapshot, supported_sports_snapshot, venue_count_estimate_snapshot,
                opening_hours_snapshot, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'JO', 'Amman', ?, ?, ?, 3, 'Daily 08:00-23:00', ?, ?)
            ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, reviewed_at = EXCLUDED.reviewed_at,
                reviewed_by_admin_user_id = EXCLUDED.reviewed_by_admin_user_id,
                decision_reason = EXCLUDED.decision_reason, updated_at = EXCLUDED.updated_at
            """,
            id, vendorId, status, timestamp(now), approved ? timestamp(now) : null, reviewedBy,
            approved ? "Approved local demo vendor" : null, number, businessName, phone, email,
            area, address, approved ? "Football,Basketball,Padel" : "Football,Tennis",
            timestamp(now), timestamp(now)
        );
    }

    private void seedFiles(Instant now) {
        seedFile(FOOTBALL_IMAGE_ID, vendorUserId, APPROVED_VENDOR_ID, "COURT_IMAGE", "PUBLIC",
            "court-images/demo/football.jpg", "football.jpg", "image/jpeg", "demo/courts/football.jpg", now);
        seedFile(BASKETBALL_IMAGE_ID, vendorUserId, APPROVED_VENDOR_ID, "COURT_IMAGE", "PUBLIC",
            "court-images/demo/basketball.jpg", "basketball.jpg", "image/jpeg", "demo/courts/basketball.jpg", now);
        seedFile(PADEL_IMAGE_ID, vendorUserId, APPROVED_VENDOR_ID, "COURT_IMAGE", "PUBLIC",
            "court-images/demo/padel.jpg", "padel.jpg", "image/jpeg", "demo/courts/padel.jpg", now);

        seedFile(LICENSE_FILE_ID, pendingVendorUserId, PENDING_VENDOR_ID, "VENDOR_VERIFICATION_DOCUMENT", "PRIVATE",
            "vendor-verification/demo/business-license.pdf", "business-license.pdf", "application/pdf", "demo/kyc/business-license.pdf", now);
        seedFile(LOGO_FILE_ID, pendingVendorUserId, PENDING_VENDOR_ID, "VENDOR_VERIFICATION_DOCUMENT", "PRIVATE",
            "vendor-verification/demo/business-logo.png", "business-logo.png", "image/png", "demo/kyc/business-logo.png", now);
        seedFile(FACILITY_FILE_ID, pendingVendorUserId, PENDING_VENDOR_ID, "VENDOR_VERIFICATION_DOCUMENT", "PRIVATE",
            "vendor-verification/demo/facility.jpg", "facility.jpg", "image/jpeg", "demo/courts/football.jpg", now);

        seedSubmissionDocument(id("41000000-0000-0000-0000-000000000011"), LICENSE_FILE_ID, "BUSINESS_LICENSE");
        seedSubmissionDocument(id("41000000-0000-0000-0000-000000000012"), LOGO_FILE_ID, "BUSINESS_LOGO");
        seedSubmissionDocument(id("41000000-0000-0000-0000-000000000013"), FACILITY_FILE_ID, "FACILITY_PHOTO");
    }

    private void seedFile(
        UUID id,
        UUID ownerUserId,
        UUID ownerVendorId,
        String purpose,
        String accessLevel,
        String objectKey,
        String fileName,
        String contentType,
        String classpathLocation,
        Instant now
    ) {
        long sizeBytes = copyDemoAsset(classpathLocation, objectKey);
        jdbcTemplate.update(
            """
            INSERT INTO files (
                id, owner_user_id, owner_vendor_id, purpose, storage_provider, bucket_name,
                object_key, original_file_name, content_type, size_bytes, access_level,
                upload_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'LOCAL', ?, ?, ?, ?, ?, ?, 'UPLOADED', ?, ?)
            ON CONFLICT (id) DO UPDATE SET object_key = EXCLUDED.object_key,
                original_file_name = EXCLUDED.original_file_name, content_type = EXCLUDED.content_type,
                size_bytes = EXCLUDED.size_bytes, access_level = EXCLUDED.access_level,
                upload_status = 'UPLOADED', updated_at = EXCLUDED.updated_at
            """,
            id, ownerUserId, ownerVendorId, purpose, fileProperties.bucket(), objectKey,
            fileName, contentType, sizeBytes, accessLevel, timestamp(now), timestamp(now)
        );
    }

    private long copyDemoAsset(String classpathLocation, String objectKey) {
        Path target = Path.of(fileProperties.localStoragePath())
            .toAbsolutePath()
            .normalize()
            .resolve(fileProperties.bucket())
            .resolve(objectKey)
            .normalize();
        try {
            Files.createDirectories(target.getParent());
            try (var input = new ClassPathResource(classpathLocation).getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return Files.size(target);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not prepare local demo asset " + classpathLocation, exception);
        }
    }

    private void seedSubmissionDocument(UUID id, UUID fileId, String documentType) {
        jdbcTemplate.update(
            """
            INSERT INTO vendor_verification_documents (id, submission_id, file_id, document_type)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET file_id = EXCLUDED.file_id, document_type = EXCLUDED.document_type
            """,
            id,
            PENDING_SUBMISSION_ID,
            fileId,
            documentType
        );
    }

    private void seedVenuesAndCourts(Instant now) {
        seedVenue(FOOTBALL_VENUE_ID, "Goal Sports Arena", "Abdoun", "Prince Hashim Street", new BigDecimal("31.949700"), new BigDecimal("35.892600"), now);
        seedVenue(BASKETBALL_VENUE_ID, "Hoops Amman", "Shmeisani", "Al Thaqafa Street", new BigDecimal("31.968200"), new BigDecimal("35.899900"), now);
        seedVenue(PADEL_VENUE_ID, "Padel District", "Sweifieh", "Paris Street", new BigDecimal("31.958100"), new BigDecimal("35.864800"), now);

        seedCourt(FOOTBALL_COURT_ID, FOOTBALL_VENUE_ID, "Five-a-side Pitch", "Outdoor floodlit football pitch.", 5, 10, FOOTBALL_IMAGE_ID, now);
        seedCourt(BASKETBALL_COURT_ID, BASKETBALL_VENUE_ID, "Main Basketball Court", "Indoor hardwood basketball court.", 3, 6, BASKETBALL_IMAGE_ID, now);
        seedCourt(PADEL_COURT_ID, PADEL_VENUE_ID, "Panoramic Padel Court", "Outdoor panoramic glass padel court.", 2, 4, PADEL_IMAGE_ID, now);
        seedCourtSport(FOOTBALL_COURT_ID, FOOTBALL_SPORT_ID);
        seedCourtSport(BASKETBALL_COURT_ID, BASKETBALL_SPORT_ID);
        seedCourtSport(PADEL_COURT_ID, PADEL_SPORT_ID);
    }

    private void seedVenue(
        UUID id,
        String name,
        String area,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        Instant now
    ) {
        jdbcTemplate.update(
            """
            INSERT INTO venues (
                id, vendor_id, name, description, country_code, city, area, address_line,
                latitude, longitude, timezone, contact_phone, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'JO', 'Amman', ?, ?, ?, ?, 'Asia/Amman', '+962790000002', 'ACTIVE', ?, ?)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
                city = EXCLUDED.city, area = EXCLUDED.area, address_line = EXCLUDED.address_line,
                latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, status = 'ACTIVE',
                updated_at = EXCLUDED.updated_at
            """,
            id, APPROVED_VENDOR_ID, name, "Modern bookable sports venue in Amman.", area, address,
            latitude, longitude, timestamp(now), timestamp(now)
        );
    }

    private void seedCourt(
        UUID id,
        UUID venueId,
        String name,
        String description,
        int minPlayers,
        int maxPlayers,
        UUID imageFileId,
        Instant now
    ) {
        jdbcTemplate.update(
            """
            INSERT INTO courts (
                id, venue_id, name, description, status, default_min_players,
                default_max_players, image_file_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
                status = 'ACTIVE', default_min_players = EXCLUDED.default_min_players,
                default_max_players = EXCLUDED.default_max_players,
                image_file_id = EXCLUDED.image_file_id, updated_at = EXCLUDED.updated_at
            """,
            id, venueId, name, description, minPlayers, maxPlayers, imageFileId,
            timestamp(now), timestamp(now)
        );
    }

    private void seedCourtSport(UUID courtId, UUID sportId) {
        jdbcTemplate.update(
            "INSERT INTO court_sports (court_id, sport_id) VALUES (?, ?) ON CONFLICT (court_id, sport_id) DO NOTHING",
            courtId,
            sportId
        );
    }

    private void seedLobbiesAndReservations(Instant now) {
        Instant footballStart = now.plus(Duration.ofDays(1)).plus(Duration.ofHours(2));
        Instant basketballStart = now.plus(Duration.ofDays(2)).plus(Duration.ofHours(1));
        Instant padelStart = now.plus(Duration.ofDays(3));
        seedLobby(FOOTBALL_LOBBY_ID, FOOTBALL_VENUE_ID, FOOTBALL_COURT_ID, FOOTBALL_SPORT_ID,
            "OPEN", footballStart, 5, 10, 6, new BigDecimal("5.00"), "Friendly 5v5 football. All levels welcome.", now);
        seedLobby(BASKETBALL_LOBBY_ID, BASKETBALL_VENUE_ID, BASKETBALL_COURT_ID, BASKETBALL_SPORT_ID,
            "OPEN", basketballStart, 3, 6, 4, new BigDecimal("4.00"), "Fast-paced 3v3 indoor basketball.", now);
        seedLobby(PADEL_LOBBY_ID, PADEL_VENUE_ID, PADEL_COURT_ID, PADEL_SPORT_ID,
            "FULL", padelStart, 2, 4, 4, new BigDecimal("7.50"), "Social doubles padel match.", now);

        jdbcTemplate.update("DELETE FROM reservations WHERE id = ?", id("80000000-0000-0000-0000-000000000001"));
        for (int index = 0; index < 6; index++) {
            seedReservation(id("80000000-0000-0000-0000-00000000001" + (index + 1)), FOOTBALL_LOBBY_ID, guestUserIds.get(index), new BigDecimal("5.00"), now);
        }
        seedReservation(id("80000000-0000-0000-0000-000000000021"), BASKETBALL_LOBBY_ID, playerUserId, new BigDecimal("4.00"), now);
        for (int index = 0; index < 3; index++) {
            seedReservation(id("80000000-0000-0000-0000-00000000002" + (index + 2)), BASKETBALL_LOBBY_ID, guestUserIds.get(index), new BigDecimal("4.00"), now);
        }
        for (int index = 0; index < 4; index++) {
            seedReservation(id("80000000-0000-0000-0000-00000000003" + (index + 1)), PADEL_LOBBY_ID, guestUserIds.get(index), new BigDecimal("7.50"), now);
        }
        syncLobbyCapacity(FOOTBALL_LOBBY_ID);
        syncLobbyCapacity(BASKETBALL_LOBBY_ID);
        syncLobbyCapacity(PADEL_LOBBY_ID);
    }

    private void seedLobby(
        UUID id,
        UUID venueId,
        UUID courtId,
        UUID sportId,
        String status,
        Instant startsAt,
        int minPlayers,
        int maxPlayers,
        int reservedPlayers,
        BigDecimal price,
        String description,
        Instant now
    ) {
        Instant endsAt = startsAt.plus(Duration.ofMinutes(90));
        Instant cancellationDeadline = startsAt.minus(Duration.ofHours(12));
        Instant confirmationDeadline = startsAt.minus(Duration.ofHours(3));
        jdbcTemplate.update(
            """
            INSERT INTO lobbies (
                id, vendor_id, venue_id, court_id, sport_id, status, starts_at, ends_at,
                venue_timezone_snapshot, min_players, max_players, reserved_seat_count,
                pricing_model, currency_code, price_per_seat, description,
                cancellation_deadline_at, confirmation_deadline_at, published_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Asia/Amman', ?, ?, ?, 'PRICE_PER_PLAYER', 'JOD', ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, starts_at = EXCLUDED.starts_at,
                ends_at = EXCLUDED.ends_at, min_players = EXCLUDED.min_players,
                max_players = EXCLUDED.max_players, reserved_seat_count = EXCLUDED.reserved_seat_count,
                price_per_seat = EXCLUDED.price_per_seat, description = EXCLUDED.description,
                cancellation_deadline_at = EXCLUDED.cancellation_deadline_at,
                confirmation_deadline_at = EXCLUDED.confirmation_deadline_at,
                published_at = EXCLUDED.published_at, updated_at = EXCLUDED.updated_at
            """,
            id, APPROVED_VENDOR_ID, venueId, courtId, sportId, status,
            timestamp(startsAt), timestamp(endsAt), minPlayers, maxPlayers, reservedPlayers,
            price, description, timestamp(cancellationDeadline), timestamp(confirmationDeadline),
            timestamp(now), timestamp(now), timestamp(now)
        );
    }

    private void seedReservation(UUID id, UUID lobbyId, UUID userId, BigDecimal price, Instant now) {
        jdbcTemplate.update(
            """
            INSERT INTO reservations (
                id, lobby_id, user_id, status, seat_count, unit_price_snapshot,
                currency_code_snapshot, reserved_at, attendance_status, created_at, updated_at
            ) VALUES (?, ?, ?, 'RESERVED', 1, ?, 'JOD', ?, 'UNKNOWN', ?, ?)
            ON CONFLICT (id) DO UPDATE SET status = 'RESERVED', unit_price_snapshot = EXCLUDED.unit_price_snapshot,
                cancelled_at = NULL, cancellation_actor = NULL, cancellation_reason_code = NULL,
                updated_at = EXCLUDED.updated_at
            """,
            id, lobbyId, userId, price, timestamp(now), timestamp(now), timestamp(now)
        );
    }

    private void syncLobbyCapacity(UUID lobbyId) {
        jdbcTemplate.update(
            """
            UPDATE lobbies
            SET reserved_seat_count = (
                    SELECT COUNT(*)::INTEGER FROM reservations
                    WHERE lobby_id = ? AND status IN ('RESERVED', 'CONFIRMED')
                ),
                status = CASE
                    WHEN (SELECT COUNT(*) FROM reservations WHERE lobby_id = ? AND status IN ('RESERVED', 'CONFIRMED')) >= max_players
                    THEN 'FULL'
                    ELSE 'OPEN'
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            lobbyId,
            lobbyId,
            lobbyId
        );
    }

    private static UUID id(String value) {
        return UUID.fromString(value);
    }

    private static Timestamp timestamp(Instant value) {
        return value == null ? null : Timestamp.from(value);
    }
}
