import * as React from 'react';
import { EmailLayout, emailComponents, brandColors } from './email-layout';

interface OrderStatusEmailProps {
  customerName: string;
  orderNumber: string;
  status: 'on_way' | 'delivered' | 'picked_up' | 'completed';
  dropoffDate?: string;
  dropoffTime?: string;
  address?: string;
  city?: string;
  state?: string;
  deliveryImage?: boolean;
}

const statusConfig = {
  on_way: {
    title: 'We\'re On Our Way! 🚚',
    emoji: '🚛',
    message: 'Our team is currently en route to your location with your dumpster.',
    action: 'We should arrive within the next hour. Please ensure the delivery area is accessible.',
    color: brandColors.info,
    type: 'info' as const,
  },
  delivered: {
    title: 'Your Dumpster Has Been Delivered! ✅',
    emoji: '📦',
    message: 'Your dumpster has been successfully delivered to your location.',
    action: 'You can now begin using your dumpster. Please follow the guidelines provided.',
    color: brandColors.success,
    type: 'success' as const,
  },
  picked_up: {
    title: 'Your Dumpster Has Been Picked Up! 🏠',
    emoji: '📤',
    message: 'We have successfully picked up your dumpster from your location.',
    action: 'Thank you for choosing ARK Dumpster! We hope you were satisfied with our service.',
    color: brandColors.warning,
    type: 'warning' as const,
  },
  completed: {
    title: 'Your Order Is Complete! 🎉',
    emoji: '✨',
    message: 'Your dumpster rental order has been completed successfully.',
    action: 'Thank you for your business! We look forward to serving you again.',
    color: brandColors.success,
    type: 'success' as const,
  },
};

export function OrderStatusEmail({
  customerName,
  orderNumber,
  status,
  dropoffDate,
  dropoffTime,
  address,
  city,
  state,
  deliveryImage = false,
}: OrderStatusEmailProps) {
  const config = statusConfig[status];
  const locationInfo = address && city && state ? `${address}, ${city}, ${state}` : 'your location';

  return (
    <EmailLayout>
      {/* Status Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>{config.emoji}</div>
        {emailComponents.heading(config.title)}
        <div style={{ 
          fontSize: '18px', 
          color: brandColors.textLight, 
          fontWeight: '500' 
        }}>
          Order #{orderNumber}
        </div>
      </div>

      {/* Personal Greeting */}
      {emailComponents.paragraph(
        `Hello ${customerName}! ${config.message}`,
        false
      )}

      {emailComponents.paragraph(config.action, false)}

      {/* Order Details */}
      {emailComponents.infoBox(
        <div>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: config.color, 
            marginBottom: '16px', 
            textAlign: 'center' 
          }}>
            📋 Order Details
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              borderBottom: '1px solid #e5e7eb', 
              paddingBottom: '8px' 
            }}>
              <strong>Order Number:</strong>
              <span style={{ fontWeight: 'bold', color: brandColors.primary }}>
                {orderNumber}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              borderBottom: '1px solid #e5e7eb', 
              paddingBottom: '8px' 
            }}>
              <strong>Location:</strong>
              <span style={{ textAlign: 'right', maxWidth: '60%' }}>
                📍 {locationInfo}
              </span>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              borderBottom: '1px solid #e5e7eb', 
              paddingBottom: '8px' 
            }}>
              <strong>Status:</strong>
              <span style={{ 
                fontWeight: 'bold', 
                color: config.color,
                textTransform: 'capitalize'
              }}>
                {status.replace('_', ' ')}
              </span>
            </div>

            {dropoffDate && dropoffTime && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between' 
              }}>
                <strong>
                  {status === 'on_way' ? 'Scheduled for:' : 'Date & Time:'}
                </strong>
                <span style={{ fontWeight: 'bold' }}>
                  {new Date(dropoffDate).toLocaleDateString()} at {dropoffTime}
                </span>
              </div>
            )}
          </div>
        </div>,
        config.type
      )}

      {/* Delivery Photo Section */}
      {deliveryImage && status === 'delivered' && (
        <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '24px' }}>
          <h3 style={{ 
            color: brandColors.success, 
            marginBottom: '16px', 
            fontSize: '18px', 
            fontWeight: 'bold' 
          }}>
            📸 Delivery Photo
          </h3>
          <div style={{ 
            backgroundColor: '#f0fdf4', 
            border: `2px solid ${brandColors.success}`, 
            borderRadius: '12px', 
            padding: '20px' 
          }}>
            <img 
              src="cid:delivery-photo" 
              alt="Delivered dumpster" 
              style={{ 
                maxWidth: '100%', 
                height: 'auto', 
                borderRadius: '8px', 
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                border: `2px solid ${brandColors.success}`
              }}
            />
            <p style={{ 
              color: brandColors.success, 
              fontSize: '14px', 
              marginTop: '12px', 
              fontStyle: 'italic' 
            }}>
              Photo taken at delivery for your records
            </p>
          </div>
        </div>
      )}

      {/* Status-specific additional info */}
      {status === 'on_way' && (
        emailComponents.infoBox(
          <div>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: brandColors.info, 
              marginBottom: '12px', 
              textAlign: 'center' 
            }}>
              📋 Delivery Checklist
            </h3>
            <ul style={{ paddingLeft: '0', margin: '0', listStyle: 'none' }}>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: brandColors.info }}>✓</span>
                <span>Clear the delivery area of any obstacles</span>
              </li>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: brandColors.info }}>✓</span>
                <span>Ensure 14+ feet of overhead clearance</span>
              </li>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: brandColors.info }}>✓</span>
                <span>Have someone available to show the placement location</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: brandColors.info }}>✓</span>
                <span>Double-check that the driveway can support the weight</span>
              </li>
            </ul>
          </div>,
          'info'
        )
      )}

      {(status === 'completed' || status === 'picked_up') && (
        emailComponents.infoBox(
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: brandColors.success, 
              marginBottom: '12px' 
            }}>
              🌟 Thank You for Choosing ARK Dumpster!
            </h3>
            <p style={{ marginBottom: '16px' }}>
              Your satisfaction is our priority. We'd love to hear about your experience!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="https://www.google.com/search?q=ARK+Dumpster+Rentals+reviews"
                style={{
                  display: 'inline-block',
                  backgroundColor: brandColors.primary,
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                ⭐ Leave a Review
              </a>
              <a
                href="https://www.arkdumpsterrentals.com"
                style={{
                  display: 'inline-block',
                  backgroundColor: brandColors.info,
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                📝 Book Again
              </a>
            </div>
          </div>,
          'success'
        )
      )}

      {/* Next Steps for Active Orders */}
      {(status === 'on_way' || status === 'delivered') && (
        <div style={{ 
          backgroundColor: '#fffbeb', 
          border: `2px solid ${brandColors.warning}`, 
          borderRadius: '8px', 
          padding: '20px', 
          marginTop: '24px',
          textAlign: 'center' 
        }}>
          <h3 style={{ 
            color: brandColors.warning, 
            marginBottom: '8px', 
            fontSize: '16px', 
            fontWeight: 'bold' 
          }}>
            🔔 Need Help or Have Questions?
          </h3>
          <p style={{ 
            color: brandColors.warning, 
            margin: '0', 
            fontSize: '14px' 
          }}>
            Contact us anytime! We're here to ensure your project goes smoothly.
          </p>
        </div>
      )}
    </EmailLayout>
  );
}