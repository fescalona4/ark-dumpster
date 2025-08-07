import { EmailTemplate } from '@/components/email-template';

export default function EmailPreview() {
  const sampleQuoteData = {
    service: '20 Yard Dumpster',
    location: '123 Main St, St. Petersburg, FL 33701',
    date: 'August 15, 2025',
    duration: '1 Week',
    message: 'Need a dumpster for home renovation project. Please deliver early morning if possible.',
    price: '$450'
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Email Template Preview</h1>
        
        <div className="grid gap-8">
          {/* Quote Email */}
          <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Quote Request Email</h2>
            <div className="border rounded-lg overflow-hidden">
              <EmailTemplate 
                firstName="John"
                type="quote"
                quoteDetails={sampleQuoteData}
              />
            </div>
          </div>

          {/* Welcome Email */}
          <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Welcome Email</h2>
            <div className="border rounded-lg overflow-hidden">
              <EmailTemplate 
                firstName="Jane"
                type="welcome"
              />
            </div>
          </div>

          {/* Confirmation Email */}
          <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Confirmation Email</h2>
            <div className="border rounded-lg overflow-hidden">
              <EmailTemplate 
                firstName="Mike"
                type="confirmation"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/"
            className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
