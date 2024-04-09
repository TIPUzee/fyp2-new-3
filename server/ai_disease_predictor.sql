-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 07, 2024 at 06:57 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ai_disease_predictor`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `m_id` int(10) UNSIGNED NOT NULL,
  `m_email` varchar(64) NOT NULL,
  `m_password` varchar(16) NOT NULL,
  `m_registration_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`m_id`, `m_email`, `m_password`, `m_registration_time`) VALUES
(1, 'root@gmail.com', '123', '2024-03-01 18:57:34');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `m_id` int(11) UNSIGNED NOT NULL,
  `m_doctor_id` int(11) UNSIGNED DEFAULT NULL,
  `m_patient_id` int(11) UNSIGNED DEFAULT NULL,
  `m_symptom_description` varchar(512) NOT NULL,
  `m_time_from` datetime NOT NULL,
  `m_time_to` datetime NOT NULL,
  `m_paid_amount` smallint(6) UNSIGNED NOT NULL,
  `m_status` enum('PAT_CANCELLED','PAT_NOT_JOINED_REQ','PAT_NOT_JOINED_REJ','PAT_NOT_JOINED','DOC_CANCELLED','DOC_REQUESTED_DELAY','DOC_NOT_JOINED','SLOT_CLASH','PENDING','COMPLETED') NOT NULL DEFAULT 'PENDING',
  `m_status_change_time` datetime NOT NULL,
  `m_delay_count_by_doc` tinyint(4) UNSIGNED NOT NULL DEFAULT 0,
  `m_reschedule_count_by_pat` tinyint(4) UNSIGNED NOT NULL DEFAULT 0,
  `m_payment_time` datetime NOT NULL,
  `m_doctor_report` varchar(768) NOT NULL DEFAULT '',
  `m_patient_review` varchar(512) NOT NULL DEFAULT '',
  `m_rating` tinyint(4) UNSIGNED NOT NULL DEFAULT 0,
  `m_secret_code` char(5) NOT NULL,
  `m_refunded_amount` smallint(6) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`m_id`, `m_doctor_id`, `m_patient_id`, `m_symptom_description`, `m_time_from`, `m_time_to`, `m_paid_amount`, `m_status`, `m_status_change_time`, `m_delay_count_by_doc`, `m_reschedule_count_by_pat`, `m_payment_time`, `m_doctor_report`, `m_patient_review`, `m_rating`, `m_secret_code`, `m_refunded_amount`) VALUES
(2, 5, 88, 'This is my symptom description', '2024-04-03 11:10:00', '2024-04-03 11:45:00', 400, 'PENDING', '2024-04-07 08:10:08', 2, 0, '2024-04-01 17:17:27', 'The report is clear.', 'Bs thek hi hai', 5, '3FG34', 0),
(3, 5, 90, 'ajsdfljsldf', '2024-04-01 13:00:00', '2024-04-02 13:30:00', 175, 'DOC_CANCELLED', '2024-04-07 12:44:37', 2, 0, '2024-03-29 20:17:33', 'fsdfsdf', 'This doctor is chapri doctor', 3, '98JC3', 0);

-- --------------------------------------------------------

--
-- Table structure for table `appointment_meeting_call_proof_videos`
--

CREATE TABLE `appointment_meeting_call_proof_videos` (
  `m_id` int(11) NOT NULL,
  `m_appointment_id` int(11) UNSIGNED NOT NULL,
  `m_filename` varchar(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointment_meeting_call_proof_videos`
--

INSERT INTO `appointment_meeting_call_proof_videos` (`m_id`, `m_appointment_id`, `m_filename`) VALUES
(22, 3, '2024-04-02-14-51-27_b9b278f6e7194636b6659bcdc12d89ad.mp4'),
(23, 3, '2024-04-02-14-51-27_763ba2994225412f8ade6165b60c9856.mp4');

-- --------------------------------------------------------

--
-- Table structure for table `availability_durations`
--

CREATE TABLE `availability_durations` (
  `m_id` int(11) NOT NULL,
  `m_doctor_id` int(11) NOT NULL,
  `m_from` smallint(6) NOT NULL,
  `m_to` smallint(6) NOT NULL,
  `m_enabled` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `availability_durations`
--

INSERT INTO `availability_durations` (`m_id`, `m_doctor_id`, `m_from`, `m_to`, `m_enabled`) VALUES
(3, 5, 480, 1110, 0),
(4, 5, 480, 720, 1),
(5, 5, 600, 810, 1),
(6, 5, 480, 1020, 0),
(7, 5, 510, 600, 0),
(8, 5, 480, 1020, 0),
(9, 5, 480, 600, 0),
(10, 12, 480, 1020, 0),
(11, 12, 480, 1020, 0),
(12, 12, 480, 1020, 0),
(13, 12, 480, 1020, 0),
(14, 12, 480, 1020, 0),
(15, 12, 480, 1020, 0),
(16, 12, 480, 1020, 0);

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `m_id` int(11) UNSIGNED NOT NULL,
  `m_specialization_category_id` int(11) UNSIGNED DEFAULT NULL,
  `m_email` varchar(64) NOT NULL,
  `m_password` varchar(16) NOT NULL,
  `m_name` varchar(32) NOT NULL,
  `m_dob` date NOT NULL,
  `m_registration_time` datetime NOT NULL,
  `m_whatsapp_number` varchar(16) NOT NULL,
  `m_profile_pic_filename` varchar(128) DEFAULT NULL,
  `m_cover_pic_filename` varchar(128) DEFAULT NULL,
  `m_wallet_amount` double NOT NULL DEFAULT 0,
  `m_max_meeting_duration` tinyint(4) NOT NULL DEFAULT 15,
  `m_appointment_charges` smallint(5) UNSIGNED ZEROFILL NOT NULL DEFAULT 00500,
  `m_status` enum('NEW_ACCOUNT','ACCOUNT_SUSPENDED','APPROVAL_REQUESTED','APPROVAL_REJECTED','ACCOUNT_APPROVED') NOT NULL DEFAULT 'NEW_ACCOUNT',
  `m_status_change_time` datetime NOT NULL,
  `m_specialization` varchar(44) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`m_id`, `m_specialization_category_id`, `m_email`, `m_password`, `m_name`, `m_dob`, `m_registration_time`, `m_whatsapp_number`, `m_profile_pic_filename`, `m_cover_pic_filename`, `m_wallet_amount`, `m_max_meeting_duration`, `m_appointment_charges`, `m_status`, `m_status_change_time`, `m_specialization`) VALUES
(5, 3, 'zshann992@gmail.com', 'Zeeshan123', 'Dr Mubasshir Ali', '2006-01-11', '2024-03-07 18:53:03', '+923016689801', '2024-04-06-18-57-23_d55ed47f62284d578432cfaff0cb5989.jpeg', '2024-04-06-18-57-05_6242a7a01a154534bf2d9dade1953aa0.jpeg', 26665, 35, 01050, 'ACCOUNT_APPROVED', '0000-00-00 00:00:00', 'Specialized in Chapri Doctorio'),
(12, 4, 'younas.m1998@gmail.com', 'Younas123123', 'Dr Younas', '2001-02-15', '2024-03-15 18:53:14', '+923016689800', '2024-03-25-19-33-00_f279d2a80e114273a9574c82f4e1b1d9.png', '2024-03-25-19-33-00_eec87df802584644af1ffe3c441a8549.png', 0, 15, 00500, 'ACCOUNT_APPROVED', '0000-00-00 00:00:00', 'Gamer');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_approval_documents`
--

CREATE TABLE `doctor_approval_documents` (
  `m_id` int(11) NOT NULL,
  `m_doctor_id` int(11) UNSIGNED NOT NULL,
  `m_filename` varchar(128) NOT NULL,
  `m_uploaded_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctor_approval_documents`
--

INSERT INTO `doctor_approval_documents` (`m_id`, `m_doctor_id`, `m_filename`, `m_uploaded_time`) VALUES
(24, 12, '2024-03-25-19-38-04_3396b3fe5b2843f5bf4b59688edda58f.pdf', '2024-03-25 19:38:04'),
(26, 5, '2024-04-01-05-43-46_a5ddfcbcf77c4237a49c3cb8b109186d.pdf', '0000-00-00 00:00:00'),
(27, 5, '2024-04-01-05-43-46_7eedc65ed9b949ff894ac5b919e79210.pdf', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_experiences`
--

CREATE TABLE `doctor_experiences` (
  `m_id` int(11) NOT NULL,
  `m_doctor_id` int(11) UNSIGNED NOT NULL,
  `m_title` varchar(64) NOT NULL,
  `m_date_from` date NOT NULL,
  `m_date_to` date DEFAULT NULL,
  `m_description` varchar(512) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctor_experiences`
--

INSERT INTO `doctor_experiences` (`m_id`, `m_doctor_id`, `m_title`, `m_date_from`, `m_date_to`, `m_description`) VALUES
(6337, 5, 'Zdkjlswdfwsadkfjlasjdflkadf', '2016-03-13', NULL, 'wrhsdgsah');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_languages`
--

CREATE TABLE `doctor_languages` (
  `m_id` int(11) NOT NULL,
  `m_doctor_id` int(11) UNSIGNED NOT NULL,
  `m_language_id` int(11) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctor_languages`
--

INSERT INTO `doctor_languages` (`m_id`, `m_doctor_id`, `m_language_id`) VALUES
(3, 5, 2),
(6, 12, 3),
(5, 5, 5);

-- --------------------------------------------------------

--
-- Table structure for table `languages`
--

CREATE TABLE `languages` (
  `m_id` int(11) UNSIGNED NOT NULL,
  `m_title` varchar(32) NOT NULL,
  `m_creation_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `languages`
--

INSERT INTO `languages` (`m_id`, `m_title`, `m_creation_time`) VALUES
(1, 'Urdu', '2024-03-12 18:54:23'),
(2, 'English', '2024-03-05 18:54:27'),
(3, 'Pashto', '2024-03-13 18:54:33'),
(4, 'Punjabi', '2024-03-13 18:54:37'),
(5, 'Farsi', '2024-03-13 18:54:40');

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `m_id` int(11) UNSIGNED NOT NULL,
  `m_email` varchar(64) NOT NULL,
  `m_password` varchar(16) NOT NULL,
  `m_name` varchar(32) NOT NULL,
  `m_dob` date NOT NULL,
  `m_whatsapp_number` varchar(16) NOT NULL,
  `m_registration_time` datetime NOT NULL,
  `m_refundable_amount` double NOT NULL DEFAULT 0,
  `m_status` enum('ACCOUNT_SUSPENDED','ACCOUNT_NOT_SUSPENDED') NOT NULL DEFAULT 'ACCOUNT_NOT_SUSPENDED'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`m_id`, `m_email`, `m_password`, `m_name`, `m_dob`, `m_whatsapp_number`, `m_registration_time`, `m_refundable_amount`, `m_status`) VALUES
(88, 'zeeshannadeem20arid1896@gmail.co', 'Ali123123', 'Ali Raza', '2006-01-01', '+923012345678', '2024-02-25 23:04:15', 0, 'ACCOUNT_NOT_SUSPENDED'),
(90, 'zshann993@gmail.com', 'Ali123123', 'Ali Raza', '2000-03-31', '+923016689805', '2024-02-25 23:06:22', 192.5, 'ACCOUNT_NOT_SUSPENDED'),
(92, 'zshann999@gmail.com', 'Zeeshan123', 'Zeeshan', '2006-02-02', '+923016689804', '2024-02-25 23:10:21', 0, 'ACCOUNT_NOT_SUSPENDED');

-- --------------------------------------------------------

--
-- Table structure for table `specialization_categories`
--

CREATE TABLE `specialization_categories` (
  `m_id` int(11) UNSIGNED NOT NULL,
  `m_title` varchar(64) NOT NULL,
  `m_creation_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `specialization_categories`
--

INSERT INTO `specialization_categories` (`m_id`, `m_title`, `m_creation_time`) VALUES
(1, 'Cardiologists', '2024-03-05 18:55:55'),
(2, 'Dermatologists', '2024-03-12 18:56:04'),
(3, 'Endocrinologists', '2024-03-21 18:56:02'),
(4, 'Gastroenterologists', '2024-03-14 18:55:59');

-- --------------------------------------------------------

--
-- Table structure for table `system_details`
--

CREATE TABLE `system_details` (
  `m_id` int(11) NOT NULL DEFAULT 1,
  `m_balance` double NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_details`
--

INSERT INTO `system_details` (`m_id`, `m_balance`) VALUES
(1, 35);

-- --------------------------------------------------------

--
-- Table structure for table `test`
--

CREATE TABLE `test` (
  `m_timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`m_id`),
  ADD UNIQUE KEY `m_email` (`m_email`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`m_id`),
  ADD KEY `m_doctor_id` (`m_doctor_id`),
  ADD KEY `m_patient_id` (`m_patient_id`);

--
-- Indexes for table `appointment_meeting_call_proof_videos`
--
ALTER TABLE `appointment_meeting_call_proof_videos`
  ADD PRIMARY KEY (`m_id`),
  ADD KEY `m_appointment_id` (`m_appointment_id`);

--
-- Indexes for table `availability_durations`
--
ALTER TABLE `availability_durations`
  ADD PRIMARY KEY (`m_id`),
  ADD KEY `m_doctor_id` (`m_doctor_id`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`m_id`),
  ADD UNIQUE KEY `m_email` (`m_email`),
  ADD UNIQUE KEY `m_whatsapp_number` (`m_whatsapp_number`),
  ADD KEY `m_specialization_category_id` (`m_specialization_category_id`);

--
-- Indexes for table `doctor_approval_documents`
--
ALTER TABLE `doctor_approval_documents`
  ADD PRIMARY KEY (`m_id`),
  ADD KEY `m_doctor_id` (`m_doctor_id`);

--
-- Indexes for table `doctor_experiences`
--
ALTER TABLE `doctor_experiences`
  ADD PRIMARY KEY (`m_id`),
  ADD KEY `m_doctor_id` (`m_doctor_id`);

--
-- Indexes for table `doctor_languages`
--
ALTER TABLE `doctor_languages`
  ADD PRIMARY KEY (`m_id`),
  ADD UNIQUE KEY `m_language_id` (`m_language_id`,`m_doctor_id`),
  ADD KEY `m_doctor_id` (`m_doctor_id`);

--
-- Indexes for table `languages`
--
ALTER TABLE `languages`
  ADD PRIMARY KEY (`m_id`),
  ADD UNIQUE KEY `m_title` (`m_title`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`m_id`),
  ADD UNIQUE KEY `m_email` (`m_email`),
  ADD UNIQUE KEY `m_whatsapp_number` (`m_whatsapp_number`);

--
-- Indexes for table `specialization_categories`
--
ALTER TABLE `specialization_categories`
  ADD PRIMARY KEY (`m_id`),
  ADD UNIQUE KEY `m_title` (`m_title`);

--
-- Indexes for table `system_details`
--
ALTER TABLE `system_details`
  ADD PRIMARY KEY (`m_id`),
  ADD UNIQUE KEY `m_id` (`m_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `m_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `m_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `appointment_meeting_call_proof_videos`
--
ALTER TABLE `appointment_meeting_call_proof_videos`
  MODIFY `m_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `availability_durations`
--
ALTER TABLE `availability_durations`
  MODIFY `m_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `m_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `doctor_approval_documents`
--
ALTER TABLE `doctor_approval_documents`
  MODIFY `m_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `doctor_experiences`
--
ALTER TABLE `doctor_experiences`
  MODIFY `m_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6338;

--
-- AUTO_INCREMENT for table `doctor_languages`
--
ALTER TABLE `doctor_languages`
  MODIFY `m_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `languages`
--
ALTER TABLE `languages`
  MODIFY `m_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `m_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `specialization_categories`
--
ALTER TABLE `specialization_categories`
  MODIFY `m_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`m_doctor_id`) REFERENCES `doctors` (`m_id`) ON DELETE SET NULL ON UPDATE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`m_patient_id`) REFERENCES `patients` (`m_id`) ON DELETE SET NULL ON UPDATE SET NULL;

--
-- Constraints for table `appointment_meeting_call_proof_videos`
--
ALTER TABLE `appointment_meeting_call_proof_videos`
  ADD CONSTRAINT `m_appointment_id` FOREIGN KEY (`m_appointment_id`) REFERENCES `appointments` (`m_id`);

--
-- Constraints for table `doctors`
--
ALTER TABLE `doctors`
  ADD CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`m_specialization_category_id`) REFERENCES `specialization_categories` (`m_id`) ON DELETE SET NULL ON UPDATE SET NULL;

--
-- Constraints for table `doctor_approval_documents`
--
ALTER TABLE `doctor_approval_documents`
  ADD CONSTRAINT `doctor_approval_documents_ibfk_1` FOREIGN KEY (`m_doctor_id`) REFERENCES `doctors` (`m_id`);

--
-- Constraints for table `doctor_experiences`
--
ALTER TABLE `doctor_experiences`
  ADD CONSTRAINT `doctor_experiences_ibfk_1` FOREIGN KEY (`m_doctor_id`) REFERENCES `doctors` (`m_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `doctor_languages`
--
ALTER TABLE `doctor_languages`
  ADD CONSTRAINT `doctor_languages_ibfk_3` FOREIGN KEY (`m_doctor_id`) REFERENCES `doctors` (`m_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `doctor_languages_ibfk_4` FOREIGN KEY (`m_language_id`) REFERENCES `languages` (`m_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;