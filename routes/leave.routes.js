const express = require('express');
const router = express.Router();
const Leave = require('../models/leave.js');

// Submit a new leave request
router.post('/leaves/submit', async (req, res) => {
  try {
    const newLeave = new Leave(req.body);
    await newLeave.save();
    res.status(201).json({ message: 'Leave request submitted', data: newLeave });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting leave request', error });
  }
});

// Get all leave requests
router.get('/leaves', async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave requests', error });
  }
});

// Delete a leave request
router.delete('/leaves/:id', async (req, res) => {
  try {
    await Leave.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Leave request deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting leave request', error });
  }
});

// Update leave request status (approve/reject)
router.put('/leaves/:id', async (req, res) => {
  try {
    const updatedLeave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.status(200).json({ message: 'Leave status updated', data: updatedLeave });
  } catch (error) {
    res.status(500).json({ message: 'Error updating leave status', error });
  }
});

module.exports = router;
