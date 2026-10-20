import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/studentController.js';

const router: Router = Router();

router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;