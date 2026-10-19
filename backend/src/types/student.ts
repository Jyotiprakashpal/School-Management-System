export interface Student {
  id: number;
  name: string;
  grade: string;
  email: string;
}

export interface CreateStudentDto {
  name: string;
  grade: string;
  email: string;
}

export interface UpdateStudentDto {
  name?: string;
  grade?: string;
  email?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}