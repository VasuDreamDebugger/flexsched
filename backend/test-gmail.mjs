import nodemailer from 'nodemailer';

// Test Gmail connection
const testGmail = async () => {
  try {
    console.log('Testing Gmail connection...');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'iftixddix@gmail.com',
        pass: 'kgezdzwgdpgtiknq'
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ Gmail connection verified successfully!');

    // Send test email
    const result = await transporter.sendMail({
      from: 'iftixddix@gmail.com',
      to: 'iftixddix@gmail.com',
      subject: 'Test Email from FlexSchedKoundy',
      text: 'This is a test email to verify the email functionality is working.',
      html: '<h1>Test Email</h1><p>This is a test email to verify the email functionality is working.</p>'
    });

    console.log('✅ Test email sent successfully!', result.messageId);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check your Gmail credentials.');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Please check your internet connection.');
    }
  }
};

testGmail();
