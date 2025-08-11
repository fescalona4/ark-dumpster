import * as React from 'react';

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
  quoteId,
  submittedAt
}: EmailTemplateProps) {
  const renderContent = () => {
    switch (type) {
      case 'company-notification':
        if (!customerDetails) return null;
        
        const fullAddress = [
          customerDetails.address,
          customerDetails.address2,
          customerDetails.city,
          customerDetails.state,
          customerDetails.zipCode
        ].filter(Boolean).join(', ');

        return (
          <>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#dc2626',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              🚨 NEW QUOTE ALERT
            </h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#4b5563', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              A new customer has submitted a quote request and needs your attention.
            </p>

            {/* Customer Info */}
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '2px solid #0ea5e9',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#0369a1', marginBottom: '12px' }}>Customer Information</h3>
              <div><strong>Name:</strong> {customerDetails.firstName} {customerDetails.lastName}</div>
              <div><strong>Phone:</strong> <a href={`tel:${customerDetails.phone}`} style={{ color: '#0369a1' }}>{customerDetails.phone}</a></div>
              <div><strong>Email:</strong> <a href={`mailto:${customerDetails.email}`} style={{ color: '#0369a1' }}>{customerDetails.email}</a></div>
              <div><strong>Address:</strong> {fullAddress}</div>
            </div>

            {/* Service Details */}
            {quoteDetails && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '2px solid #22c55e',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: '#166534', marginBottom: '12px' }}>Service Details</h3>
                {quoteDetails.service && <div><strong>Service:</strong> {quoteDetails.service}</div>}
                {quoteDetails.date && <div><strong>Date:</strong> {quoteDetails.date}</div>}
                {quoteDetails.duration && <div><strong>Duration:</strong> {quoteDetails.duration}</div>}
                {quoteDetails.message && <div><strong>Message:</strong> {quoteDetails.message}</div>}
              </div>
            )}

            {/* Action Required */}
            <div style={{
              backgroundColor: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#dc2626', marginBottom: '12px' }}>Action Required</h3>
              <p style={{ color: '#dc2626', marginBottom: '16px' }}>
                Contact this customer within 24 hours to provide a quote.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <a href={`tel:${customerDetails.phone}`} style={{
                  backgroundColor: '#22c55e',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}>
                  Call Customer
                </a>
                <a href={`mailto:${customerDetails.email}`} style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}>
                  Email Customer
                </a>
              </div>
            </div>
          </>
        );

      case 'quote':
        return (
          <>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Your Dumpster Rental Quote
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: '#4b5563', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Hi {firstName}, here's your personalized quote from ARK Dumpster:
            </p>
            <div style={{
              backgroundColor: '#f9fafb',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              {quoteDetails?.service && (
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#1f2937' }}>Service:</strong> {quoteDetails.service}
                </div>
              )}
              {quoteDetails?.location && (
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#1f2937' }}>Location:</strong> {quoteDetails.location}
                </div>
              )}
              {quoteDetails?.date && (
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#1f2937' }}>Date:</strong> {quoteDetails.date}
                </div>
              )}
              {quoteDetails?.duration && (
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#1f2937' }}>Duration:</strong> {quoteDetails.duration}
                </div>
              )}
              {quoteDetails?.message && (
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#1f2937' }}>Additional Details:</strong> {quoteDetails.message}
                </div>
              )}
              {quoteDetails?.price && (
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: '#059669',
                  marginTop: '16px',
                  textAlign: 'center'
                }}>
                  Estimated Price: {quoteDetails.price}
                </div>
              )}
            </div>
          </>
        );
      
      case 'confirmation':
        return (
          <>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Booking Confirmed!
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: '#4b5563', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Hi {firstName}, your dumpster rental has been confirmed. We'll be in touch soon with delivery details.
            </p>
          </>
        );
      
      default: // welcome
        return (
          <>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Welcome to ARK Dumpster!
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: '#4b5563', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Hi {firstName}, thank you for choosing ARK Dumpster for your waste management needs. We're excited to serve you!
            </p>
          </>
        );
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#374151'
    }}>
      {/* Header with gradient background */}
      <div style={{
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
        padding: '32px 24px',
        borderRadius: '12px 12px 0 0',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '8px'
        }}>
          ARK
        </div>
        <div style={{
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.9)'
        }}>
          Dumpster Rental Services
        </div>
      </div>

      {/* Main content */}
      <div style={{
        backgroundColor: 'white',
        padding: '32px 24px',
        border: '1px solid #e5e7eb',
        borderTop: 'none'
      }}>
        {renderContent()}

        {/* Reply instructions */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '2px solid #0ea5e9',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            color: '#0369a1', 
            marginBottom: '8px',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            💬 Have Questions? Just Reply!
          </h3>
          <p style={{ 
            color: '#0369a1', 
            margin: '0',
            fontSize: '16px'
          }}>
            Simply reply to this email to reach us directly at <strong>arkdumpsterrentals@gmail.com</strong>
          </p>
        </div>

        {/* Contact information */}
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '16px',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            color: '#1f2937', 
            marginBottom: '12px',
            fontSize: '18px'
          }}>
            Need Immediate Help?
          </h3>
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Our team is here to assist you with any questions.
          </p>
          <div style={{ 
            color: '#059669', 
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            📞 <a href="tel:7275641794" style={{ color: '#059669', textDecoration: 'none' }}>(727) 564-1794</a> | 📧 <a href="mailto:arkdumpsterrentals@gmail.com" style={{ color: '#059669', textDecoration: 'none' }}>arkdumpsterrentals@gmail.com</a>
          </div>
        </div>

        {/* Call to action */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <a href="https://www.arkdumpsterrentals.com" style={{
            display: 'inline-block',
            backgroundColor: '#f97316',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            Visit Our Website
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '24px',
        borderRadius: '0 0 12px 12px',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        <p style={{ margin: '0 0 8px 0' }}>
          ARK Dumpster Rentals - Reliable Waste Management Solutions
        </p>
        <p style={{ margin: '0', color: '#9ca3af' }}>
          St Petersburg & Tampa Bay | Follow us on social media
        </p>
      </div>
    </div>
  );
}