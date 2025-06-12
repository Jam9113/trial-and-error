const LeaveRequest = require('../models/leaverequest');

exports.createLeave = async (req, res) => {
  try {
    const leave = new LeaveRequest(req.body);
    await leave.save();
    res.status(201).json({ message: 'Leave request submitted successfully.' });
  } catch (error) {
    console.error('Error saving leave request:', error);
    res.status(500).json({ message: 'Failed to save leave request.' });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find();
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve leave requests.' });
  }
};
