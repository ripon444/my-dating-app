-- ==========================================================
-- GlobalMatch Dating Platform - Complete MySQL Database Schema
-- Database: globalmatch_db
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `boosts`;
DROP TABLE IF EXISTS `verifications`;
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `matches`;
DROP TABLE IF EXISTS `likes`;
DROP TABLE IF EXISTS `profiles`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) DEFAULT '$2a$10$wN3b.9EevT1PvZVkW9z83O..samplehash',
  `role` ENUM('USER', 'ADMIN', 'MODERATOR') NOT NULL DEFAULT 'USER',
  `is_banned` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: profiles
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL UNIQUE,
  `name` VARCHAR(120) NOT NULL,
  `gender` ENUM('MALE', 'FEMALE', 'NON_BINARY', 'OTHER') NOT NULL DEFAULT 'MALE',
  `dob` DATE NOT NULL,
  `bio` TEXT DEFAULT NULL,
  `photos` LONGTEXT DEFAULT NULL COMMENT 'JSON array of photo URLs',
  `voice_intro_url` TEXT DEFAULT NULL,
  `interests` LONGTEXT DEFAULT NULL COMMENT 'JSON array of interests',
  `lat` DECIMAL(10, 8) DEFAULT NULL,
  `lng` DECIMAL(11, 8) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT NULL,
  `height_cm` INT DEFAULT NULL,
  `education` VARCHAR(150) DEFAULT NULL,
  `occupation` VARCHAR(150) DEFAULT NULL,
  `relationship_goal` VARCHAR(100) DEFAULT 'LONG_TERM',
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `subscription_tier` ENUM('FREE', 'GOLD', 'PLATINUM') NOT NULL DEFAULT 'FREE',
  `super_likes_count` INT NOT NULL DEFAULT 1,
  `boosts_count` INT NOT NULL DEFAULT 0,
  `last_active` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_profile_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: likes
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `likes` (
  `id` VARCHAR(64) NOT NULL,
  `sender_id` VARCHAR(64) NOT NULL,
  `receiver_id` VARCHAR(64) NOT NULL,
  `is_super_like` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_sender_receiver` (`sender_id`, `receiver_id`),
  CONSTRAINT `fk_like_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_like_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: matches
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `matches` (
  `id` VARCHAR(64) NOT NULL,
  `user1_id` VARCHAR(64) NOT NULL,
  `user2_id` VARCHAR(64) NOT NULL,
  `compatibility_score` INT DEFAULT 85,
  `is_ai_recommended` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_match_pair` (`user1_id`, `user2_id`),
  CONSTRAINT `fk_match_user1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_match_user2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: messages
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(64) NOT NULL,
  `match_id` VARCHAR(64) NOT NULL,
  `sender_id` VARCHAR(64) NOT NULL,
  `content` TEXT NOT NULL,
  `type` ENUM('TEXT', 'IMAGE', 'VOICE', 'ICEBREAKER') NOT NULL DEFAULT 'TEXT',
  `media_url` TEXT DEFAULT NULL,
  `translated_content` TEXT DEFAULT NULL,
  `target_language` VARCHAR(10) DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_msg_match` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: transactions (Revenue & Subscriptions)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `tier` ENUM('GOLD', 'PLATINUM', 'SUPER_LIKE_PACK', 'BOOST_PACK') NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'STRIPE',
  `payment_status` ENUM('COMPLETED', 'PENDING', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'COMPLETED',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: reports & moderation
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reports` (
  `id` VARCHAR(64) NOT NULL,
  `reporter_id` VARCHAR(64) NOT NULL,
  `reported_id` VARCHAR(64) NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `status` ENUM('PENDING', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_report_reported` FOREIGN KEY (`reported_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seed Initial Admin and Demo Profiles
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `email`, `role`, `is_banned`, `created_at`) VALUES
('usr_admin_01', 'admin@globalmatch.com', 'ADMIN', 0, NOW()),
('usr_alex_02', 'alex.morgan@example.com', 'ADMIN', 0, NOW()),
('usr_elena_03', 'elena.rostova@example.com', 'USER', 0, NOW()),
('usr_mei_04', 'mei.ling@example.com', 'USER', 0, NOW()),
('usr_sofia_05', 'sofia.martinez@example.com', 'USER', 0, NOW()),
('usr_zara_06', 'zara.almansoor@example.com', 'USER', 0, NOW())
ON DUPLICATE KEY UPDATE `role` = VALUES(`role`);

INSERT INTO `profiles` (`id`, `user_id`, `name`, `gender`, `dob`, `bio`, `photos`, `interests`, `lat`, `lng`, `city`, `country`, `is_verified`, `subscription_tier`) VALUES
('prf_admin_01', 'usr_admin_01', 'Super Admin', 'MALE', '1992-05-14', 'Head Administrator of GlobalMatch Dating Platform.', '["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"]', '["Tech", "Management", "Travel"]', 23.8103, 90.4125, 'Dhaka', 'Bangladesh', 1, 'PLATINUM'),
('prf_alex_02', 'usr_alex_02', 'Alex Morgan', 'MALE', '1998-04-12', 'Architectural photographer & coffee lover. Looking for genuine cultural connections.', '["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800"]', '["Architecture", "Photography", "Travel", "Jazz", "Coffee"]', 40.7128, -74.0060, 'New York', 'United States', 1, 'PLATINUM'),
('prf_elena_03', 'usr_elena_03', 'Elena Rostova', 'FEMALE', '1999-08-22', 'Classical pianist & art curator. Love vintage vinyl and cozy cafes.', '["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"]', '["Piano", "Classical Music", "Art History", "Museums"]', 55.7558, 37.6173, 'Moscow', 'Russia', 1, 'GOLD'),
('prf_mei_04', 'usr_mei_04', 'Mei Ling', 'FEMALE', '2000-02-14', 'UX Designer passionate about sustainable architecture, pottery, and indie films.', '["https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800"]', '["UI/UX", "Pottery", "Indie Films", "Tea Ceremony"]', 31.2304, 121.4737, 'Shanghai', 'China', 1, 'PLATINUM'),
('prf_sofia_05', 'usr_sofia_05', 'Sofia Martinez', 'FEMALE', '1997-11-03', 'Marine biologist and scuba instructor. Always planning the next dive expedition.', '["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800"]', '["Scuba Diving", "Marine Biology", "Salsa", "Ocean Conservation"]', 41.3879, 2.1699, 'Barcelona', 'Spain', 1, 'GOLD'),
('prf_zara_06', 'usr_zara_06', 'Zara Al-Mansoor', 'FEMALE', '1998-06-19', 'Fashion director & desert hiker. Passionate about contemporary Middle Eastern art.', '["https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800"]', '["Haute Couture", "Desert Hiking", "Modern Art", "Astronomy"]', 25.2048, 55.2708, 'Dubai', 'United Arab Emirates', 1, 'PLATINUM')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
