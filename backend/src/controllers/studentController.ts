import { Request, Response } from 'express';
import { Student, CreateStudentDto, UpdateStudentDto } from '../types/student.js';

const students: Student[] = [
  { id: 1, name: 'John Doe', grade: '10th', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', grade: '11th', email: 'jane@example.com' }
];

export const getAllStudents = (_req: Request, res: Response<Student[]>) => {
  res.json(students);
};

export const getStudentById = (req: Request<{ id: string }>, res: Response<Student | { error: string }>) => {
  const student = students.find(s => s.id === parseInt(req.params.id));
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(student);
};

export const createStudent = (req: Request<{}, Student, CreateStudentDto>, res: Response<Student>) => {
  const { name, grade, email } = req.body;
  const newStudent: Student = {
    id: students.length + 1,
    name,
    grade,
    email
  };
  students.push(newStudent);
  res.status(201).json(newStudent);
};

export const updateStudent = (req: Request<{ id: string }, Student | { error: string }, UpdateStudentDto>, res: Response<Student | { error: string }>) => {
  const student = students.find(s => s.id === parseInt(req.params.id));
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  const { name, grade, email } = req.body;
  if (name) student.name = name;
  if (grade) student.grade = grade;
  if (email) student.email = email;
  res.json(student);
};

export const deleteStudent = (req: Request<{ id: string }>, res: Response<void | { error: string }>) => {
  const index = students.findIndex(s => s.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }
  students.splice(index, 1);
  res.status(204).send();
};