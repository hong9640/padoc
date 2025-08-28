CREATE TABLE `accounts` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `login_id` varchar(255) UNIQUE NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) UNIQUE,
  `phone_number` varchar(20),
  `role` ENUM ('patient', 'doctor', 'admin') NOT NULL,
  `created_at` timestamp DEFAULT (now()),
  `updated_at` timestamp DEFAULT (now())
);

CREATE TABLE `patients` (
  `account_id` integer PRIMARY KEY,
  `address` text,
  `gender` ENUM ('male', 'female', 'other'),
  `age` integer
);

CREATE TABLE `doctors` (
  `account_id` integer PRIMARY KEY,
  `address` text,
  `gender` ENUM ('male', 'female', 'other'),
  `age` integer,
  `valid_license_id` varchar(255) UNIQUE NOT NULL,
  `is_verified` boolean NOT NULL DEFAULT false
);

CREATE TABLE `patient_doctor_access` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `doctor_id` integer NOT NULL,
  `patient_id` integer NOT NULL,
  `status` ENUM ('pending', 'approved', 'rejected', 'terminated') NOT NULL DEFAULT 'pending',
  `created_at` timestamp DEFAULT (now()),
  `updated_at` timestamp DEFAULT (now())
);

CREATE TABLE `voice_records` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `patient_id` integer NOT NULL,
  `related_voice_record_id` integer,
  `file_path` varchar(255) NOT NULL,
  `type` ENUM ('None', 'voice_ah', 'voice_sentence') NOT NULL DEFAULT 'None',
  `created_at` timestamp DEFAULT (now())
);

CREATE TABLE `ah_features` (
  `record_id` integer PRIMARY KEY,
  `jitter_local` float,
  `jitter_rap` float,
  `jitter_ppq5` float,
  `jitter_ddp` float,
  `shimmer_local` float,
  `shimmer_apq3` float,
  `shimmer_apq5` float,
  `shimmer_apq11` float,
  `shimmer_dda` float,
  `hnr` float,
  `nhr` float,
  `f0` float,
  `max_f0` float,
  `min_f0` float
);

CREATE TABLE `sentence_features` (
  `record_id` integer PRIMARY KEY,
  `cpp` float,
  `csid` float,
  `sampling_data` jsonb
);

CREATE TABLE `doctor_notes` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `doctor_id` integer NOT NULL,
  `patient_id` integer NOT NULL,
  `note_content` text NOT NULL,
  `created_at` timestamp DEFAULT (now()),
  `updated_at` timestamp DEFAULT (now())
);

CREATE TABLE `calendar_events` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `patient_id` integer NOT NULL,
  `event_date` date NOT NULL,
  `created_at` timestamp DEFAULT (now()),
  `updated_at` timestamp DEFAULT (now())
);

CREATE TABLE `doctor_patient_view_settings` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `doctor_id` integer UNIQUE NOT NULL,
  `connected_patient_order` json,
  `pending_patient_order` json,
  `unconnected_patient_order` json,
  `updated_at` timestamp DEFAULT (now())
);

CREATE TABLE `advanced_training_information` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `patient_id` integer UNIQUE NOT NULL,
  `avg_score` integer,
  `progress` ENUM ('level1', 'level2', 'level3', 'level4'),
  `created_at` timestamp DEFAULT (now())
);

CREATE UNIQUE INDEX `patient_doctor_access_index_0` ON `patient_doctor_access` (`patient_id`, `doctor_id`);

ALTER TABLE `patients` ADD FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`);

ALTER TABLE `doctors` ADD FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`);

ALTER TABLE `patient_doctor_access` ADD FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`account_id`);

ALTER TABLE `patient_doctor_access` ADD FOREIGN KEY (`patient_id`) REFERENCES `patients` (`account_id`);

ALTER TABLE `voice_records` ADD FOREIGN KEY (`patient_id`) REFERENCES `patients` (`account_id`);

ALTER TABLE `voice_records` ADD FOREIGN KEY (`related_voice_record_id`) REFERENCES `voice_records` (`id`);

ALTER TABLE `ah_features` ADD FOREIGN KEY (`record_id`) REFERENCES `voice_records` (`id`);

ALTER TABLE `sentence_features` ADD FOREIGN KEY (`record_id`) REFERENCES `voice_records` (`id`);

ALTER TABLE `doctor_notes` ADD FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`account_id`);

ALTER TABLE `doctor_notes` ADD FOREIGN KEY (`patient_id`) REFERENCES `patients` (`account_id`);

ALTER TABLE `calendar_events` ADD FOREIGN KEY (`patient_id`) REFERENCES `patients` (`account_id`);

ALTER TABLE `doctor_patient_view_settings` ADD FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`account_id`);

ALTER TABLE `advanced_training_information` ADD FOREIGN KEY (`patient_id`) REFERENCES `patients` (`account_id`);
