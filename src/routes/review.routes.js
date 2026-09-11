import express from 'express';
import {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

// Setting mergeParams to true allows this router to access params from the parent router (e.g. productId)
const router = express.Router({ mergeParams: true });

router.route('/')
  .get(getReviews)
  .post(protect, addReview); // Requires productID in the route

router.route('/:id')
  .get(getReview)
  .patch(protect, updateReview)
  .delete(protect, deleteReview);

export default router;
