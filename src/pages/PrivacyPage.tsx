import { Shield, FileText, Lock, Eye } from "lucide-react";

export function PrivacyPage() {
  const lastUpdated = "March 2026";

  return (
    <div className="min-h-screen bg-[#0F1219] text-white p-6 md:p-12 selection:bg-[var(--primary)] selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8 bg-[#1A1F2E] p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl">
        
        <div className="border-b border-white/10 pb-8 mb-8">
          <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center mb-6 border border-[var(--primary)]/20">
            <Shield className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last Updated: {lastUpdated}</p>
        </div>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-muted-foreground">
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--primary)]" />
              1. Introduction
            </h2>
            <p>
              Welcome to Organize Your Club ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website (organizeyourclub.com) and use our application.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-[var(--primary)]" />
              2. Information We Collect
            </h2>
            <p>We collect personal information that you voluntarily provide to us when you register for the application, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Personal Data:</strong> Name, email address, and passwords (stored securely via cryptographic hashing).</li>
              <li><strong className="text-white">Organization Data:</strong> Chapter names, member roles, and internal compliance data.</li>
            </ul>
          </section>

          {/* THIS IS THE CRITICAL SECTION FOR GOOGLE VERIFICATION */}
          <section className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-[var(--primary)]" />
              3. Google API Services User Data Policy (Limited Use)
            </h2>
            <p>
              Organize Your Club offers an integration with Google Drive to allow users to attach documents (such as PDFs, Docs, and Sheets) to their organization's secure repository. 
            </p>
            <p>
              Our application uses the Google Drive Picker API. We <strong>only</strong> access the specific files that you explicitly select within the picker window. We do not request, nor do we have, access to your entire Google Drive. 
            </p>
            <p className="font-semibold text-white">
              Organize Your Club's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>We do <strong>not</strong> use your Google data for serving advertisements.</li>
              <li>We do <strong>not</strong> sell your Google data to third parties.</li>
              <li>We only store the secure URL link and metadata (name, file type) of the file you explicitly select to display it within your organization's dashboard.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--primary)]" />
              4. How We Share Your Information
            </h2>
            <p>
              We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information with our trusted infrastructure partners (such as Supabase for database hosting and Resend for email communications) strictly for the purpose of operating the application.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">5. Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">6. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at: <br/>
              <a href="mailto:support@organizeyourclub.com" className="text-[var(--primary)] hover:underline font-medium mt-2 inline-block">support@organizeyourclub.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}