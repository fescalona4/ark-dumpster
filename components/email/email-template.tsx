import * as React from 'react';
import { EmailLayout, emailComponents, brandColors } from './email-layout';

interface EmailTemplateProps {
  firstName: string;
  type?: 'welcome' | 'quote' | 'confirmation' | 'company-notification';
  quoteDetails?: {
    service?: string;
    location?: string;
    date?: string;
    duration?: string;
    message?: string;
    price?: string;
  };
  customerDetails?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  quoteId?: string;
  submittedAt?: string;
}

export function EmailTemplate({
  firstName,
  type = 'welcome',
  quoteDetails,
  customerDetails,
}: EmailTemplateProps) {
  // Don't render company notification in this component - use CompanyNotificationEmail instead
  if (type === 'company-notification') {
    return null;
  }
  const renderContent = () => {
    switch (type) {
      case 'quote':
        return (
          <>
            {emailComponents.heading('Your Dumpster Rental Quote')}
            {emailComponents.paragraph(
              `Hi ${firstName}! Thank you for your interest in ARK Dumpster services. We've received your quote request and here are the details:`,
              true
            )}
            
            {emailComponents.infoBox(
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: brandColors.info, marginBottom: '16px', textAlign: 'center' }}>
                  📋 Quote Details
                </h3>
                
                {quoteDetails?.service && (
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bfdbfe', paddingBottom: '8px' }}>
                    <strong>Service:</strong> 
                    <span style={{ fontWeight: '600', color: brandColors.primary }}>{quoteDetails.service}</span>
                  </div>
                )}
                {quoteDetails?.location && (
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bfdbfe', paddingBottom: '8px' }}>
                    <strong>Location:</strong> 
                    <span style={{ textAlign: 'right', maxWidth: '60%' }}>{quoteDetails.location}</span>
                  </div>
                )}
                {quoteDetails?.date && (
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bfdbfe', paddingBottom: '8px' }}>
                    <strong>Preferred Date:</strong> 
                    <span style={{ fontWeight: '600' }}>{quoteDetails.date}</span>
                  </div>
                )}
                {quoteDetails?.duration && (
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bfdbfe', paddingBottom: '8px' }}>
                    <strong>Duration:</strong> 
                    <span style={{ fontWeight: '600' }}>{quoteDetails.duration}</span>
                  </div>
                )}
                {quoteDetails?.message && (
                  <div style={{ marginTop: '16px' }}>
                    <strong>Additional Details:</strong>
                    <div style={{ backgroundColor: '#e0f2fe', padding: '12px', borderRadius: '6px', marginTop: '8px', fontStyle: 'italic' }}>
                      &ldquo;{quoteDetails.message}&rdquo;
                    </div>
                  </div>
                )}
                {quoteDetails?.price && (
                  <div style={{ marginTop: '20px', textAlign: 'center', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: `2px solid ${brandColors.success}` }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: brandColors.success }}>
                      Estimated Price: {quoteDetails.price}
                    </div>
                    <div style={{ fontSize: '14px', color: brandColors.textLight, marginTop: '4px' }}>
                      *Final pricing may vary based on specific requirements
                    </div>
                  </div>
                )}
              </div>,
              'info'
            )}
            
            {emailComponents.paragraph(
              'Our team will review your request and contact you within 24 hours with a detailed quote and to schedule your dumpster delivery.',
              false
            )}
          </>
        );

      case 'confirmation':
        return (
          <>
            {emailComponents.heading('Booking Confirmed! 🎉')}
            {emailComponents.paragraph(
              `Hi ${firstName}! Great news - your dumpster rental has been confirmed and is now in our system.`,
              true
            )}
            
            {emailComponents.infoBox(
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: brandColors.success, marginBottom: '12px', textAlign: 'center' }}>
                  ✅ What Happens Next?
                </h3>
                <ul style={{ paddingLeft: '20px', margin: '0', listStyle: 'none' }}>
                  <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: brandColors.success, fontSize: '16px' }}>📞</span>
                    <span>We'll call you to confirm delivery details and timing</span>
                  </li>
                  <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: brandColors.success, fontSize: '16px' }}>🚚</span>
                    <span>Your dumpster will be delivered on the scheduled date</span>
                  </li>
                  <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: brandColors.success, fontSize: '16px' }}>📱</span>
                    <span>You'll receive status updates throughout the process</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: brandColors.success, fontSize: '16px' }}>🏠</span>
                    <span>We'll pick up the dumpster when you're ready</span>
                  </li>
                </ul>
              </div>,
              'success'
            )}
            
            {quoteDetails && (
              emailComponents.infoBox(
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: brandColors.info, marginBottom: '12px', textAlign: 'center' }}>
                    📋 Your Order Details
                  </h3>
                  
                  {quoteDetails.service && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Service:</strong> {quoteDetails.service}
                    </div>
                  )}
                  {quoteDetails.location && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Location:</strong> {quoteDetails.location}
                    </div>
                  )}
                  {quoteDetails.date && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Scheduled Date:</strong> {quoteDetails.date}
                    </div>
                  )}
                  {quoteDetails.duration && (
                    <div>
                      <strong>Duration:</strong> {quoteDetails.duration}
                    </div>
                  )}
                </div>,
                'info'
              )
            )}
            
            {emailComponents.paragraph(
              'If you have any questions or need to make changes to your order, please don\'t hesitate to contact us.',
              false
            )}
          </>
        );

      default: // welcome
        return (
          <>
            {emailComponents.heading('Welcome to ARK Dumpster! 🗑️')}
            {emailComponents.paragraph(
              `Hi ${firstName}! Thank you for choosing ARK Dumpster for your waste management needs. We're excited to serve you and make your project cleanup as easy as possible.`,
              true
            )}
            
            {emailComponents.infoBox(
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: brandColors.info, marginBottom: '12px', textAlign: 'center' }}>
                  🚀 Why Choose ARK Dumpster?
                </h3>
                <ul style={{ paddingLeft: '20px', margin: '0', listStyle: 'none' }}>
                  <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: brandColors.primary, fontSize: '16px' }}>⚡</span>
                    <span>Fast, reliable delivery and pickup service</span>
                  </li>
                  <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: brandColors.primary, fontSize: '16px' }}>💲</span>
                    <span>Competitive pricing with no hidden fees</span>
                  </li>
                  <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: brandColors.primary, fontSize: '16px' }}>🏆</span>
                    <span>Locally owned and operated in Tampa Bay</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: brandColors.primary, fontSize: '16px' }}>🤝</span>
                    <span>Excellent customer service and support</span>
                  </li>
                </ul>
              </div>,
              'info'
            )}
            
            {emailComponents.paragraph(
              'Ready to get started? Contact us anytime to discuss your project needs and get a free quote.',
              false
            )}
          </>
        );
    }
  };

  return (
    <EmailLayout>
      {renderContent()}
      
      {/* Reply instructions for customer emails */}
      {(
        <div
          style={{
            backgroundColor: '#f0f9ff',
            border: `2px solid ${brandColors.info}`,
            borderRadius: '8px',
            padding: '20px',
            marginTop: '24px',
            textAlign: 'center',
          }}
        >
          <h3
            style={{
              color: brandColors.info,
              marginBottom: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            💬 Questions? Just Reply!
          </h3>
          <p
            style={{
              color: brandColors.info,
              margin: '0',
              fontSize: '16px',
            }}
          >
            Reply to this email or contact us directly - we typically respond within a few hours!
          </p>
        </div>
      )}
    </EmailLayout>
  );
}
