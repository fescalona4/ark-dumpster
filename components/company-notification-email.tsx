import * as React from 'react';

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
  submittedAt
}: CompanyNotificationEmailProps) {
  const fullAddress = [
    customerDetails.address,
    customerDetails.address2,
    customerDetails.city,
    customerDetails.state,
    customerDetails.zipCode
  ].filter(Boolean).join(', ');

  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#374151'
    }}>
      {/* Header with urgent styling */}
      <div style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)',
        padding: '24px',
        borderRadius: '12px 12px 0 0',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '8px'
        }}>
          🚨 NEW QUOTE ALERT
        </div>
        <div style={{
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.9)'
        }}>
          ARK Dumpster Rentals - Action Required
        </div>
      </div>

      {/* Main content */}
      <div style={{
        backgroundColor: 'white',
        padding: '32px 24px',
        border: '1px solid #e5e7eb',
        borderTop: 'none'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          New Quote Request Received
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          color: '#4b5563', 
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          A new customer has submitted a quote request and needs your attention.
        </p>

        {/* Quote ID and timestamp */}
        {quoteId && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#92400e',
              marginBottom: '4px'
            }}>
              Quote ID: {quoteId}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#92400e'
            }}>
              Submitted: {new Date(submittedAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* Customer Information */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '2px solid #0ea5e9',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#0369a1',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            👤 Customer Information
          </h2>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              borderBottom: '1px solid #bae6fd',
              paddingBottom: '8px'
            }}>
              <strong style={{ color: '#0369a1' }}>Name:</strong>
              <span style={{ color: '#1e40af' }}>{customerDetails.firstName} {customerDetails.lastName}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              borderBottom: '1px solid #bae6fd',
              paddingBottom: '8px'
            }}>
              <strong style={{ color: '#0369a1' }}>Phone:</strong>
              <a href={`tel:${customerDetails.phone}`} style={{ 
                color: '#1e40af', 
                textDecoration: 'none',
                fontWeight: 'bold'
              }}>
                📞 {customerDetails.phone}
              </a>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              borderBottom: '1px solid #bae6fd',
              paddingBottom: '8px'
            }}>
              <strong style={{ color: '#0369a1' }}>Email:</strong>
              <a href={`mailto:${customerDetails.email}`} style={{ 
                color: '#1e40af', 
                textDecoration: 'none',
                fontWeight: 'bold'
              }}>
                📧 {customerDetails.email}
              </a>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between'
            }}>
              <strong style={{ color: '#0369a1' }}>Address:</strong>
              <span style={{ 
                color: '#1e40af',
                textAlign: 'right',
                maxWidth: '60%'
              }}>
                📍 {fullAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '2px solid #22c55e',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#166534',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            🗑️ Service Details
          </h2>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              borderBottom: '1px solid #bbf7d0',
              paddingBottom: '8px'
            }}>
              <strong style={{ color: '#166534' }}>Dumpster Size:</strong>
              <span style={{ color: '#15803d', fontWeight: 'bold' }}>{quoteDetails.dumpsterSize} yard</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              borderBottom: '1px solid #bbf7d0',
              paddingBottom: '8px'
            }}>
              <strong style={{ color: '#166534' }}>Dropoff Date:</strong>
              <span style={{ color: '#15803d', fontWeight: 'bold' }}>{quoteDetails.dropoffDate}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              borderBottom: '1px solid #bbf7d0',
              paddingBottom: '8px'
            }}>
              <strong style={{ color: '#166534' }}>Duration:</strong>
              <span style={{ color: '#15803d', fontWeight: 'bold' }}>{quoteDetails.timeNeeded}</span>
            </div>
            
            {quoteDetails.message && (
              <div style={{ marginTop: '8px' }}>
                <strong style={{ color: '#166534' }}>Customer Message:</strong>
                <div style={{ 
                  backgroundColor: '#dcfce7',
                  padding: '12px',
                  borderRadius: '6px',
                  marginTop: '8px',
                  color: '#15803d',
                  fontStyle: 'italic'
                }}>
                  "{quoteDetails.message}"
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Required */}
        <div style={{
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#dc2626',
            marginBottom: '12px'
          }}>
            ⚡ Action Required
          </h2>
          <p style={{ 
            color: '#dc2626', 
            marginBottom: '16px',
            fontSize: '16px'
          }}>
            This customer is waiting for a response. Please contact them within 24 hours to provide a quote.
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <a href={`tel:${customerDetails.phone}`} style={{
              display: 'inline-block',
              backgroundColor: '#22c55e',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              📞 Call Customer
            </a>
            
            <a href={`mailto:${customerDetails.email}?subject=Re: Dumpster Rental Quote Request&body=Hi ${customerDetails.firstName},%0D%0A%0D%0AThank you for your interest in ARK Dumpster Rentals. I'm reaching out regarding your recent quote request for a ${quoteDetails.dumpsterSize}-yard dumpster.%0D%0A%0D%0ABest regards,%0D%0AARK Dumpster Rentals Team`} style={{
              display: 'inline-block',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              📧 Email Customer
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            color: '#1f2937', 
            marginBottom: '12px',
            fontSize: '16px'
          }}>
            📋 Admin Panel Access
          </h3>
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            View this quote and manage customer responses in your admin dashboard.
          </p>
          <a href="https://arkdumpsterrentals.com/admin/quotes" style={{
            display: 'inline-block',
            backgroundColor: '#64748b',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            Open Admin Panel
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '20px',
        borderRadius: '0 0 12px 12px',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
          ARK Dumpster Rentals - Internal Notification System
        </p>
        <p style={{ margin: '0', color: '#9ca3af' }}>
          This is an automated notification. Please respond to the customer promptly.
        </p>
      </div>
    </div>
  );
}
