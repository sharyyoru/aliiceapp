import Link from "next/link";
import Image from "next/image";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur-lg border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logos/aliice-logo.png" alt="Aliice" width={100} height={32} className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Login</Link>
            <Link href="/signup" className="rounded-full bg-gradient-to-r from-sky-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white">
              Request a Demo
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8">
            ← Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>

          <div className="prose prose-slate prose-lg max-w-none">
            <p className="text-slate-600 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Information We Collect</h2>
              <p className="text-slate-600 mb-4">
                Aliice collects information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Name and contact information (email, phone number)</li>
                <li>Company or organization details</li>
                <li>Account credentials and authentication data</li>
                <li>Patient records and medical information (for healthcare providers)</li>
                <li>Payment and billing information</li>
                <li>Communications with our support team</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-slate-600 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to comments and questions</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, prevent, and address technical issues and fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Data Security</h2>
              <p className="text-slate-600 mb-4">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and assessments</li>
                <li>GDPR compliance for European users</li>
                <li>Swiss data hosting for enhanced privacy protection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Data Retention</h2>
              <p className="text-slate-600">
                We retain your personal data for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Your Rights</h2>
              <p className="text-slate-600 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Access and review your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Third-Party Services</h2>
              <p className="text-slate-600 mb-4">
                We use third-party services to help operate our business, including:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Supabase for database and authentication</li>
                <li>Resend for email delivery</li>
                <li>Stripe for payment processing</li>
                <li>Google for calendar integration</li>
              </ul>
              <p className="text-slate-600">
                These third parties have access to your personal data only to perform specific tasks on our behalf and are obligated not to disclose or use it for any other purpose.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. International Data Transfers</h2>
              <p className="text-slate-600">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy and applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Changes to This Policy</h2>
              <p className="text-slate-600">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Contact Us</h2>
              <p className="text-slate-600 mb-4">
                If you have any questions about this privacy policy, please contact us:
              </p>
              <ul className="list-none text-slate-600 space-y-2">
                <li>Email: <a href="mailto:info@aliice.app" className="text-sky-600 hover:underline">info@aliice.app</a></li>
                <li>Website: <a href="https://www.aliice.app" className="text-sky-600 hover:underline">www.aliice.app</a></li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className="text-sm text-slate-500">© 2025 Aliice. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-900">Privacy</Link>
            <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-900">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
