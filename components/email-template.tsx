import * as React from 'react';

interface EmailTemplateProps {
  firstName: string;
  type?: 'welcome' | 'quote' | 'confirmation';
  quoteDetails?: {
    service?: string;
    location?: string;
    date?: string;
    price?: string;
  };
}

export function EmailTemplate({ 
  firstName, 
  type = 'welcome',
  quoteDetails 
}: EmailTemplateProps) {
  const renderContent = () => {
    switch (type) {
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

        {/* Contact information */}
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            color: '#1f2937', 
            marginBottom: '12px',
            fontSize: '18px'
          }}>
            Need Help?
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
            📞 (727) 555-0123 | 📧 info@arkdumpster.com
          </div>
        </div>

        {/* Call to action */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <a href="https://arkdumpster.com" style={{
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
          ARK Dumpster - Reliable Waste Management Solutions
        </p>
        <p style={{ margin: '0', color: '#9ca3af' }}>
          St Petersburg & Tampa Bay Area | Follow us on social media
        </p>
      </div>
    </div>
  );
}