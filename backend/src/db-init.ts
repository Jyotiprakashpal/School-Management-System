import { userRepository } from './models/User.js';
import { studentRepository } from './models/Student.js';
import { admissionEnquiryRepository } from './models/AdmissionEnquiry.js';
import { settingsRepository } from './models/Settings.js';

export async function initializeDatabase(): Promise<void> {
  await userRepository.initializeTable();
  await studentRepository.initializeTable();
  await admissionEnquiryRepository.initializeTable();
  await settingsRepository.initializeTable();
}