// app/privacy/page.tsx
import React from "react";

const LAST_UPDATED = "December 8, 2025";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-12 text-slate-900">
        <h1 className="text-3xl font-bold tracking-tight">
          PromoHubAI Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated {LAST_UPDATED}
        </p>

        {/* Introduction */}
        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <p>
            This Privacy Policy describes how <strong>PromoHubAI</strong>, a platform
            operated by <strong>IdThrivo Technology Sdn Bhd (1210868-T)</strong>
            (&quot;PromoHubAI&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;),
            handles personal information when you access or use our software, tools,
            websites, and integrations, including WhatsApp-based automation and
            AI-driven engagement features (collectively, the &quot;Services&quot;).
          </p>
          <p>
            By using the Services, you acknowledge and agree that your information
            will be collected, processed, and used in accordance with this Privacy
            Policy. If you do not agree, you should discontinue use of the Services.
          </p>
        </section>

        {/* 1. Definitions */}
        <section className="mt-10 space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">1. Key Definitions</h2>
          <p>
            <strong>Personal Data</strong> refers to information that identifies,
            relates to, or could reasonably be linked to an individual.
          </p>
          <p>
            <strong>Customer</strong> refers to a business, organization, or
            individual account holder that uses PromoHubAI.
          </p>
          <p>
            <strong>End User</strong> refers to any person who communicates with a
            Customer through PromoHubAI-powered channels such as WhatsApp, chat
            widgets, or branded microsites.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">2. Information We Collect</h2>

          <h3 className="mt-4 font-semibold">
            2.1 Account and Business Details
          </h3>
          <ul className="ml-5 list-disc space-y-1">
            <li>Name, email address, and contact number</li>
            <li>Business name, industry, and operational details</li>
            <li>Login credentials and authentication records</li>
            <li>Subscription, billing, and payment-related data</li>
            <li>User preferences, roles, and configuration settings</li>
          </ul>

          <h3 className="mt-4 font-semibold">
            2.2 Messaging and Communication Data
          </h3>
          <p>
            When you enable WhatsApp or similar integrations, PromoHubAI may process
            data on your behalf to deliver and automate communications, including:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>WhatsApp Business API identifiers and setup information</li>
            <li>Messages, timestamps, delivery status, and read confirmations</li>
            <li>Contact records and conversation history</li>
            <li>Automation rules, tags, and engagement logs</li>
            <li>Media files exchanged through supported channels</li>
          </ul>
          <p className="text-xs text-slate-500">
            PromoHubAI acts as a data processor for this information. Customers
            remain responsible for obtaining valid consent and determining lawful
            use of End User data.
          </p>

          <h3 className="mt-4 font-semibold">
            2.3 Technical and Usage Information
          </h3>
          <ul className="ml-5 list-disc space-y-1">
            <li>IP address and general location data</li>
            <li>Device, browser, and operating system information</li>
            <li>System logs and feature interaction records</li>
            <li>Performance diagnostics and analytics</li>
            <li>Cookie and tracking technology data</li>
          </ul>
        </section>

        {/* 3. How We Use Data */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">
            3. How We Use Information
          </h2>
          <p>Your information is used to:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Operate, maintain, and improve the Services</li>
            <li>Enable messaging, automation, and AI-driven workflows</li>
            <li>Process payments and manage subscriptions</li>
            <li>Provide technical support and customer assistance</li>
            <li>Enhance personalization and feature performance</li>
            <li>Detect fraud, misuse, and security incidents</li>
            <li>Meet legal, regulatory, and contractual obligations</li>
          </ul>
        </section>

        {/* 4. AI Processing */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">
            4. Artificial Intelligence and Automation
          </h2>
          <p>
            PromoHubAI incorporates artificial intelligence to support automation
            and insights, including:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Message classification and intent recognition</li>
            <li>Automated replies and workflow generation</li>
            <li>Content optimization for conversational engagement</li>
            <li>Business analytics and interaction insights</li>
          </ul>
          <p>
            Where feasible, data used to improve system performance is aggregated
            or de-identified. PromoHubAI does not sell Personal Data or use
            identifiable customer data to train external AI models.
          </p>
        </section>

        {/* 5. Legal Basis */}
        <section className="mt-10 space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">
            5. Legal Basis for Processing
          </h2>
          <p>
            Depending on applicable law, we process Personal Data under one or more
            of the following bases:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Performance of a contract</li>
            <li>Legitimate business interests</li>
            <li>User consent, where required</li>
            <li>Compliance with legal obligations</li>
          </ul>
        </section>

        {/* 6. Data Sharing */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">
            6. Sharing and Disclosure
          </h2>
          <p>
            PromoHubAI does not sell personal information. Data may be disclosed
            only in the following circumstances:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              With infrastructure, analytics, or payment service providers acting
              under strict confidentiality obligations
            </li>
            <li>
              With platform partners such as Meta / WhatsApp where required to
              deliver messaging services
            </li>
            <li>
              As part of a corporate transaction such as merger or acquisition
            </li>
            <li>
              When required by law or to protect legal rights and system security
            </li>
            <li>With explicit user consent</li>
          </ul>
        </section>

        {/* 7. Security */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">
            7. Information Security
          </h2>
          <p>
            We apply reasonable technical and organizational safeguards, including
            encryption, access controls, monitoring, and internal security
            policies. Despite these efforts, no digital system is entirely risk
            free.
          </p>
        </section>

        {/* 8. Retention */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">8. Data Retention</h2>
          <p>
            Information is retained only as long as needed to provide the Services,
            meet legal requirements, or resolve disputes. Customers may request
            account deletion in accordance with applicable obligations.
          </p>
        </section>

        {/* 9. Cookies */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">
            9. Cookies and Tracking
          </h2>
          <p>
            PromoHubAI uses cookies and similar tools to support authentication,
            analytics, and user preferences. You may control cookie behavior
            through your browser, though some features may be limited.
          </p>
        </section>

        {/* 10. Rights */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">
            10. Your Privacy Rights
          </h2>
          <p>
            Subject to local law, you may request access, correction, deletion,
            restriction, portability, or withdrawal of consent relating to your
            Personal Data. End Users should contact the relevant Customer directly.
          </p>
        </section>

        {/* 11. Children */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">
            11. Children’s Privacy
          </h2>
          <p>
            PromoHubAI is not designed for individuals under 16 years of age. We do
            not knowingly collect data from minors.
          </p>
        </section>

        {/* 12. Updates */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">
            12. Policy Updates
          </h2>
          <p>
            This Privacy Policy may be revised from time to time. Continued use of
            the Services after updates constitutes acceptance of the revised
            policy.
          </p>
        </section>

        {/* 13. Contact */}
        <section className="mt-10 mb-4 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">13. Contact Information</h2>
          <p>
            For privacy-related questions or requests, contact us at:
          </p>
          <p>
            <strong>Support Email:</strong> support@promohubai.com
          </p>
          <p>
            <strong>Company:</strong> IdThrivo Technology Sdn Bhd (1210868-T)<br />
            Innovation Incubation Centre, Unit 21, 1st Floor<br />
            Resource Centre, Technology Park Malaysia<br />
            Bukit Jalil, 57000 Kuala Lumpur, Malaysia
          </p>
        </section>
      </div>
    </main>
  );
}
