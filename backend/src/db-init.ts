import { userRepository } from './models/User.js';
import { studentRepository } from './models/Student.js';

export async function initializeDatabase(): Promise<void> {
  await userRepository.initializeTable();
  await studentRepository.initializeTable();
}