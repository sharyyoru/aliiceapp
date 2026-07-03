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

          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-8">
              Last updated: July 3, 2026
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
              <p className="text-slate-600">
                Aliice ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our clinic management platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Information We Collect</h2>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">2.1 Personal Information</h3>
              <p className="text-slate-600 mb-4">
                We collect information you provide directly, including:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>Name and contact details (email, phone number)</li>
                <li>Company/clinic information</li>
                <li>Account credentials</li>
                <li>Payment information (processed securely through third-party providers)</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">2.2 Patient Data</h3>
              <p className="text-slate-600 mb-4">
                For healthcare providers using our platform, we process patient data including:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>Patient names and contact information</li>
                <li>Medical history and treatment records</li>
                <li>Appointment schedules</li>
                <li>Invoices and payment records</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">2.3 Usage Data</h3>
              <p className="text-slate-600">
                We automatically collect information about your use of our platform, including IP address, device information, and usage patterns.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-slate-600 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>Provide and improve our services</li>
                <li>Process transactions and send invoices</li>
                <li>Communicate with you about your account</li>
                <li>Send important notices and updates</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Data Security</h2>
              <p className="text-slate-600 mb-4">
                We implement appropriate technical and organizational measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>All data is encrypted in transit and at rest</li>
                <li>We host data in Switzerland (GDPR compliant)</li>
                <li>Access to data is restricted to authorized personnel only</li>
                <li>Regular security audits and penetration testing</li>
                <li>Compliance with healthcare data protection regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Data Sharing</h2>
              <p className="text-slate-600 mb-4">
                We do not sell your personal data. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>With your explicit consent</li>
                <li>With service providers who perform services on our behalf (e.g., payment processors, email services)</li>
                <li>To comply with legal obligations or court orders</li>
                <li>To protect our rights, property, or safety</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Your Rights</h2>
              <p className="text-slate-600 mb-4">
                Under GDPR and Swiss data protection laws, you have the right to:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="text-slate-600">
                To exercise these rights, contact us at privacy@aliice.app
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Data Retention</h2>
              <p className="text-slate-600">
                We retain your data only as long as necessary for the purposes outlined in this policy, unless required by law to retain it longer. When you delete your account, we will delete or anonymize your personal data within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Third-Party Services</h2>
              <p className="text-slate-600 mb-4">
                We use third-party services to operate our platform:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li><strong>Supabase</strong> - Database and authentication</li>
                <li><strong>Resend</strong> - Email delivery</li>
                <li><strong>Payrexx</strong> - Payment processing</li>
                <li><strong>Google</strong> - Calendar and email integration</li>
              </ul>
              <p className="text-slate-600">
                These services have their own privacy policies, which we encourage you to review.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. International Data Transfers</h2>
              <p className="text-slate-600">
                Your data is primarily stored in Switzerland. Any international transfers are conducted in compliance with GDPR requirements using appropriate safeguards such as Standard Contractual Clauses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Children's Privacy</h2>
              <p className="text-slate-600">
                Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Changes to This Policy</h2>
              <p className="text-slate-600">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Contact Us</h2>
              <p className="text-slate-600 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-none text-slate-600">
                <li>Email: privacy@aliice.app</li>
                <li>Address: Switzerland</li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className="text-sm text-slate-500">© 2026 Aliice. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-900">Privacy</Link>
            <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-900">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
