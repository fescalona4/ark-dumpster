const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

console.log('Testing Resend API...');
console.log('API Key exists:', !!process.env.RESEND_API_KEY);
console.log('API Key length:', process.env.RESEND_API_KEY?.length);
console.log('API Key format:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');

const resend = new Resend(process.env.RESEND_API_KEY);

// Test the simplest possible email
resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'delivered@resend.dev', // Use Resend's test email
  subject: 'Test Email',
  text: 'This is a test email.'
}).then(result => {
  console.log('SUCCESS! Email sent:', result);
  process.exit(0);
}).catch(error => {
  console.error('ERROR sending email:', error);
  console.error('Error details:', JSON.stringify(error, null, 2));
  process.exit(1);
});
