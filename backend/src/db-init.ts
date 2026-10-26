import { userRepository } from './models/User.js';
import { studentRepository } from './models/Student.js';
import { admissionEnquiryRepository } from './models/AdmissionEnquiry.js';
import { settingsRepository } from './models/Settings.js';
import { notificationRepository } from './models/Notification.js';
import { admissionRepository } from './models/Admission.js';
import { archivedStudentRepository } from './models/ArchivedStudent.js';
import { promotionRepository } from './models/Promotion.js';
import { feeRepository } from './models/Fee.js';
import { feeCollectionRepository } from './models/FeeCollection.js';
import { attendanceRepository } from './models/Attendance.js';
import { examRepository } from './models/Exam.js';
import { examScheduleRepository } from './models/ExamSchedule.js';

export async function initializeDatabase(): Promise<void> {
  await userRepository.initializeTable();
  await studentRepository.initializeTable();
  await admissionEnquiryRepository.initializeTable();
  await settingsRepository.initializeTable();
  await notificationRepository.initializeTable();
  await admissionRepository.initializeTable();
  await archivedStudentRepository.initializeTable();
  await promotionRepository.initializeTable();
  await feeRepository.initializeTable();
  await feeCollectionRepository.initializeTable();
  await attendanceRepository.initializeTable();
  await examRepository.initializeTable();
  await examScheduleRepository.initializeTable();
}