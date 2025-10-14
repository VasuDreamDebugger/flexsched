import express from 'express';
import { sendSwapRequestNotification } from '../utils/emailService.js';

const router = express.Router();

// Test email functionality
router.get('/test-email', async (req, res) => {
  try {
    const testEmail = 'iftixddix@gmail.com'; // Send to yourself for testing
    
    const result = await sendSwapRequestNotification(
      testEmail,
      'Test Faculty',
      'Target Faculty',
      {
        swapDate: new Date(),
        reason: 'Testing email functionality',
        requesterClass: {
          day: 'Monday',
          periods: ['1'],
          subject: 'Test Subject',
          room: 'A101',
          faculty: 'Test Faculty'
        },
        targetClass: {
          day: 'Tuesday',
          periods: ['2'],
          subject: 'Target Subject',
          room: 'B202',
          faculty: 'Target Faculty'
        }
      }
    );

    if (result) {
      res.json({
        success: true,
        message: 'Test email sent successfully! Check your inbox.',
        sentTo: testEmail
      });
    } else {
      res.json({
        success: false,
        message: 'Failed to send test email'
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
});

export default router;
