# Email Notification Setup

This application uses email notifications to inform faculty members about class swap requests and responses.

## Setup Instructions

### 1. Gmail Setup (Recommended - Free)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Copy the 16-character password

### 2. Environment Variables

Create a `.env` file in the backend directory with:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
FRONTEND_URL=http://localhost:5173
```

### 3. Alternative Email Providers

You can also use other email providers by modifying the transporter configuration in `src/utils/emailService.js`:

#### Outlook/Hotmail
```javascript
const transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

#### Custom SMTP
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Email Templates

The system sends three types of emails:

1. **Swap Request Notification** - Sent to target faculty when a request is made
2. **Swap Response Notification** - Sent to requester when request is accepted/rejected
3. **Student Notification** - Sent to students when a swap is completed (future feature)

## Testing

To test email functionality:

1. Set up the environment variables
2. Create a swap request
3. Check the console logs for email sending status
4. Check the target faculty's email inbox

## Troubleshooting

- **Authentication failed**: Check your email credentials and app password
- **Connection timeout**: Check your internet connection and firewall settings
- **Emails not received**: Check spam folder and email provider settings

## Security Notes

- Never commit `.env` files to version control
- Use app passwords instead of your main account password
- Consider using a dedicated email account for the application
