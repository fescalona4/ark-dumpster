import * as React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  showBrandingHeader?: boolean;
}

// ARK Dumpster brand colors
const brandColors = {
  primary: '#f97316', // Orange-500
  primaryDark: '#ea580c', // Orange-600
  secondary: '#dc2626', // Red-600
  dark: '#1f2937', // Gray-800
  light: '#f3f4f6', // Gray-100
  text: '#374151', // Gray-700
  textLight: '#6b7280', // Gray-500
  border: '#e5e7eb', // Gray-200
  success: '#059669', // Emerald-600
  warning: '#d97706', // Amber-600
  error: '#dc2626', // Red-600
  info: '#0ea5e9', // Sky-500
};

const emailStyles = {
  // Base container
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    lineHeight: '1.6',
    color: brandColors.text,
    backgroundColor: '#ffffff',
  },
  
  // Header with gradient
  header: {
    background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryDark} 50%, ${brandColors.secondary} 100%)`,
    padding: '32px 24px',
    borderRadius: '12px 12px 0 0',
    textAlign: 'center' as const,
  },
  
  // Brand title
  brandTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '8px',
    letterSpacing: '2px',
  },
  
  // Brand subtitle
  brandSubtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
  },
  
  // Main content area
  content: {
    backgroundColor: 'white',
    padding: '32px 24px',
    border: `1px solid ${brandColors.border}`,
    borderTop: 'none',
  },
  
  // Footer
  footer: {
    backgroundColor: brandColors.dark,
    color: 'white',
    padding: '32px 24px',
    borderRadius: '0 0 12px 12px',
    textAlign: 'center' as const,
    fontSize: '14px',
  },
  
  // Contact info section
  contactSection: {
    backgroundColor: brandColors.light,
    padding: '24px',
    borderRadius: '8px',
    marginTop: '24px',
    textAlign: 'center' as const,
    border: `1px solid ${brandColors.border}`,
  },
  
  // Action button
  actionButton: {
    display: 'inline-block',
    backgroundColor: brandColors.primary,
    color: 'white',
    padding: '14px 28px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '16px',
    marginTop: '16px',
    transition: 'all 0.3s ease',
  },
  
  // Secondary button
  secondaryButton: {
    display: 'inline-block',
    backgroundColor: brandColors.info,
    color: 'white',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '14px',
    margin: '4px',
  },
  
  // Success button
  successButton: {
    display: 'inline-block',
    backgroundColor: brandColors.success,
    color: 'white',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '14px',
    margin: '4px',
  },
};

export function EmailLayout({ 
  children, 
  headerTitle,
  headerSubtitle,
  showBrandingHeader = true 
}: EmailLayoutProps) {
  return (
    <div style={emailStyles.container}>
      {/* Header */}
      {showBrandingHeader && (
        <div style={emailStyles.header}>
          <div style={emailStyles.brandTitle}>
            {headerTitle || 'ARK'}
          </div>
          <div style={emailStyles.brandSubtitle}>
            {headerSubtitle || 'Dumpster Rental Services'}
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={emailStyles.content}>
        {children}
      </div>

      {/* Contact Information */}
      <div style={emailStyles.contactSection}>
        <h3
          style={{
            color: brandColors.dark,
            marginBottom: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          Need Assistance?
        </h3>
        <p
          style={{
            color: brandColors.textLight,
            marginBottom: '12px',
            fontSize: '14px',
          }}
        >
          Our team is here to help with any questions or concerns.
        </p>
        <div
          style={{
            color: brandColors.success,
            fontWeight: 'bold',
            fontSize: '16px',
            lineHeight: '1.8',
          }}
        >
          📞{' '}
          <a 
            href="tel:7275641794" 
            style={{ 
              color: brandColors.success, 
              textDecoration: 'none' 
            }}
          >
            (727) 564-1794
          </a>
        </div>
        <div
          style={{
            color: brandColors.success,
            fontWeight: 'bold',
            fontSize: '16px',
            lineHeight: '1.8',
          }}
        >
          📧{' '}
          <a
            href="mailto:info@arkdumpsterrentals.com"
            style={{ 
              color: brandColors.success, 
              textDecoration: 'none' 
            }}
          >
            info@arkdumpsterrentals.com
          </a>
        </div>
      </div>

      {/* Call to Action */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <a
          href="https://www.arkdumpsterrentals.com"
          style={emailStyles.actionButton}
        >
          Visit Our Website
        </a>
      </div>

      {/* Footer */}
      <div style={emailStyles.footer}>
        <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>
          ARK Dumpster Rentals - Reliable Waste Management Solutions
        </p>
        <p style={{ margin: '0 0 12px 0', color: '#9ca3af' }}>
          Serving St Petersburg, Tampa Bay & Surrounding Areas
        </p>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '16px' }}>
          <p style={{ margin: '0 0 4px 0' }}>
            This email was sent to you because you are a customer of ARK Dumpster Rentals.
          </p>
          <p style={{ margin: '0' }}>
            If you have questions about this email, please reply directly or contact us using the information above.
          </p>
        </div>
      </div>
    </div>
  );
}

// Export styled components for reuse
export const emailComponents = {
  heading: (text: string, level: 1 | 2 | 3 = 1) => {
    const sizes = {
      1: '28px',
      2: '22px', 
      3: '18px'
    };
    
    return (
      <h1
        style={{
          fontSize: sizes[level],
          fontWeight: 'bold',
          color: brandColors.dark,
          marginBottom: '16px',
          textAlign: 'center',
          lineHeight: '1.3',
        }}
      >
        {text}
      </h1>
    );
  },
  
  paragraph: (text: string, centered: boolean = false) => (
    <p
      style={{
        fontSize: '16px',
        color: brandColors.text,
        marginBottom: '16px',
        textAlign: centered ? 'center' : 'left',
        lineHeight: '1.6',
      }}
    >
      {text}
    </p>
  ),
  
  infoBox: (children: React.ReactNode, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const typeColors = {
      info: { bg: '#f0f9ff', border: brandColors.info, text: '#0c4a6e' },
      success: { bg: '#f0fdf4', border: brandColors.success, text: '#14532d' },
      warning: { bg: '#fffbeb', border: brandColors.warning, text: '#92400e' },
      error: { bg: '#fef2f2', border: brandColors.error, text: '#991b1b' },
    };
    
    const colors = typeColors[type];
    
    return (
      <div
        style={{
          backgroundColor: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <div style={{ color: colors.text }}>
          {children}
        </div>
      </div>
    );
  },
};

// Export brand colors and styles for external use
export { brandColors, emailStyles };