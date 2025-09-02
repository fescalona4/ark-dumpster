import * as React from 'react';
import { EmailLayout, emailComponents, brandColors } from './email-layout';

interface CompanyNotificationEmailProps {
  customerDetails: {
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
  quoteDetails: {
    dropoffDate: string;
    timeNeeded: string;
    dumpsterSize: string;
    message?: string;
  };
  quoteId?: string;
  submittedAt: string;
}

export function CompanyNotificationEmail({
  customerDetails,
  quoteDetails,
  quoteId,
  submittedAt,
}: CompanyNotificationEmailProps) {
  const fullAddress = [
    customerDetails.address,
    customerDetails.address2,
    customerDetails.city,
    customerDetails.state,
    customerDetails.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <EmailLayout 
      headerTitle="🚨 NEW QUOTE ALERT" 
      headerSubtitle="ARK Dumpster Rentals - Action Required"
    >
      {emailComponents.heading('New Quote Request Received')}
      {emailComponents.paragraph(
        'A new customer has submitted a quote request and needs your immediate attention.',
        true
      )}

      {/* Quote ID and timestamp */}
      {quoteId && (
        emailComponents.infoBox(
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Quote ID: {quoteId}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              Submitted: {new Date(submittedAt).toLocaleString()}
            </div>
          </div>,
          'warning'
        )
      )}

      {/* Customer Information */}
      {emailComponents.infoBox(
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: brandColors.info, marginBottom: '16px', textAlign: 'center' }}>
            👤 Customer Information
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bfdbfe', paddingBottom: '8px' }}>
              <strong>Name:</strong>
              <span style={{ fontWeight: 'bold' }}>
                {customerDetails.firstName} {customerDetails.lastName}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bfdbfe', paddingBottom: '8px' }}>
              <strong>Phone:</strong>
              <a href={`tel:${customerDetails.phone}`} style={{ color: brandColors.success, textDecoration: 'none', fontWeight: 'bold' }}>
                📞 {customerDetails.phone}
              </a>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bfdbfe', paddingBottom: '8px' }}>
              <strong>Email:</strong>
              <a href={`mailto:${customerDetails.email}`} style={{ color: brandColors.success, textDecoration: 'none', fontWeight: 'bold' }}>
                📧 {customerDetails.email}
              </a>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Address:</strong>
              <span style={{ textAlign: 'right', maxWidth: '60%' }}>
                📍 {fullAddress}
              </span>
            </div>
          </div>
        </div>,
        'info'
      )}

      {/* Service Details */}
      {emailComponents.infoBox(
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: brandColors.success, marginBottom: '16px', textAlign: 'center' }}>
            🗑️ Service Details
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bbf7d0', paddingBottom: '8px' }}>
              <strong>Dumpster Size:</strong>
              <span style={{ fontWeight: 'bold', color: brandColors.primary }}>
                {quoteDetails.dumpsterSize} yard
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bbf7d0', paddingBottom: '8px' }}>
              <strong>Dropoff Date:</strong>
              <span style={{ fontWeight: 'bold' }}>
                {quoteDetails.dropoffDate}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bbf7d0', paddingBottom: '8px' }}>
              <strong>Duration:</strong>
              <span style={{ fontWeight: 'bold' }}>
                {quoteDetails.timeNeeded}
              </span>
            </div>
            
            {quoteDetails.message && (
              <div style={{ marginTop: '16px' }}>
                <strong>Customer Message:</strong>
                <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '12px', borderRadius: '6px', marginTop: '8px', fontStyle: 'italic' }}>
                  &ldquo;{quoteDetails.message}&rdquo;
                </div>
              </div>
            )}
          </div>
        </div>,
        'success'
      )}

      {/* Action Required */}
      {emailComponents.infoBox(
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: brandColors.error, marginBottom: '12px' }}>
            ⚡ Action Required
          </h3>
          <p style={{ marginBottom: '20px', fontSize: '16px' }}>
            This customer is waiting for a response. Please contact them within 24 hours to provide a quote.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={`tel:${customerDetails.phone}`}
              style={{
                display: 'inline-block',
                backgroundColor: brandColors.success,
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              📞 Call Customer
            </a>
            
            <a
              href={`mailto:${customerDetails.email}?subject=Re: Dumpster Rental Quote Request&body=Hi ${customerDetails.firstName},%0D%0A%0D%0AThank you for your interest in ARK Dumpster Rentals. I'm reaching out regarding your recent quote request for a ${quoteDetails.dumpsterSize}-yard dumpster.%0D%0A%0D%0ABest regards,%0D%0AARK Dumpster Rentals Team`}
              style={{
                display: 'inline-block',
                backgroundColor: brandColors.info,
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              📧 Email Customer
            </a>
          </div>
        </div>,
        'error'
      )}

      {/* Admin Panel Access */}
      <div style={{ marginTop: '24px', textAlign: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
        <h3 style={{ color: brandColors.dark, marginBottom: '12px', fontSize: '16px' }}>
          📋 Admin Panel Access
        </h3>
        <p style={{ color: brandColors.textLight, marginBottom: '16px', fontSize: '14px' }}>
          View this quote and manage customer responses in your admin dashboard.
        </p>
        <a
          href="https://arkdumpsterrentals.com/admin/quotes"
          style={{
            display: 'inline-block',
            backgroundColor: brandColors.dark,
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          Open Admin Panel
        </a>
      </div>
    </EmailLayout>
  );
}
