// app/terms/page.tsx
import React from "react";

const LAST_UPDATED = "December 8, 2025";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-12 text-slate-900">
        <h1 className="text-3xl font-bold tracking-tight">PromoHubAI Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated {LAST_UPDATED}</p>

        {/* Intro / Legal Notice */}
        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <p>
            These Terms of Service (the &quot;Terms&quot;) govern your access to and use of{" "}
            <strong>PromoHubAI</strong>, a product of{" "}
            <strong>IdThrivo Technology Sdn Bhd (1210868-T)</strong> (&quot;PromoHubAI,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;),
            including our websites, web applications, WhatsApp integrations, and any related
            tools, APIs, or services (collectively, the &quot;Services&quot;).
          </p>
          <p>
            By creating an account, accessing, or using the Services, you agree to be bound
            by these Terms. If you do not agree, you must not use the Services.
          </p>
          
        </section>

        {/* 1. Eligibility & Account Holder */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">1. Eligibility &amp; Account Responsibility</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              You must be at least 18 years old and have the legal capacity to enter into a
              binding contract to use the Services.
            </li>
            <li>
              If you use the Services on behalf of a company or other entity, you represent
              that you have authority to bind that entity to these Terms. In such cases,
              &quot;you&quot; and &quot;your&quot; refer to that entity.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your login
              credentials and for all activities that occur under your account.
            </li>
            <li>
              You agree to provide accurate, current, and complete information and to keep
              it updated (including contact and billing details).
            </li>
            <li>
              You must notify us promptly if you suspect any unauthorised access or misuse
              of your account.
            </li>
          </ul>
        </section>

        {/* 2. Description of the Services */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">2. Description of the Services</h2>
          <p>
            PromoHubAI provides a cloud-based, AI-assisted promotion and engagement
            platform, which may include:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Promo microsite and landing page generation.</li>
            <li>WhatsApp and other messaging channel integrations.</li>
            <li>AI-powered chatbots, auto-replies, and conversation workflows.</li>
            <li>Campaigns, broadcasts, and marketing automation tools.</li>
            <li>Lead capture, basic CRM and tagging features.</li>
            <li>Analytics, reports, and insights about engagement and traffic.</li>
            <li>APIs, webhooks, and integrations with third-party platforms.</li>
          </ul>
          <p>
            We may enhance, modify, or discontinue any feature or component of the Services
            at our discretion. Where changes materially affect your use of the Services, we
            will endeavour to provide reasonable notice.
          </p>
        </section>

        {/* 3. Account Registration & Access */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">3. Account Registration &amp; Access</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Some features require registration. When you register, you must select
              credentials (such as email and password) or use supported single sign-on
              methods.
            </li>
            <li>
              You are responsible for any users you invite or provision within your
              organisation’s account and for setting appropriate roles and permissions.
            </li>
            <li>
              We may suspend or restrict access if we reasonably suspect a breach of these
              Terms, unauthorised use, security risk, or non-payment.
            </li>
          </ul>
        </section>

        {/* 4. Plans, Fees & Billing */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">4. Plans, Fees &amp; Billing</h2>
          <p>
            Access to certain features may require a paid subscription or usage-based
            pricing. Specific plan details, quotas, and pricing are set out on our website
            or in an applicable order form (collectively, the &quot;Subscription&quot;).
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Billing Cycle:</strong> Unless stated otherwise, subscriptions are billed
              in advance on a monthly or yearly basis and renew automatically.
            </li>
            <li>
              <strong>Authorisation:</strong> By providing a payment method, you authorise us (and
              our payment processor) to charge applicable fees, taxes, and any overage
              amounts.
            </li>
            <li>
              <strong>Taxes:</strong> You are responsible for all applicable taxes, levies, or
              duties imposed by authorities, excluding our income taxes.
            </li>
            <li>
              <strong>Price Changes:</strong> We may adjust our fees or plan structure. For active
              subscriptions, material price changes will take effect at the next renewal,
              with prior notice where practicable.
            </li>
            <li>
              <strong>Non-Payment:</strong> If payment fails or is not received, we may suspend or
              downgrade your access until outstanding amounts are settled.
            </li>
            <li>
              <strong>Refunds:</strong> Unless we explicitly state otherwise in writing, fees
              already paid are non-refundable.
            </li>
          </ul>
        </section>

        {/* 5. Acceptable Use & Customer Responsibilities */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">5. Acceptable Use &amp; Customer Responsibilities</h2>
          <p>
            You agree to use the Services in a responsible and lawful manner. You must not:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Use the Services in violation of any applicable law or regulation.</li>
            <li>
              Send spam, bulk unsolicited messages, or communications without the required
              consent.
            </li>
            <li>
              Use the Services to promote or distribute illegal, harmful, or abusive
              content.
            </li>
            <li>
              Harass, threaten, or harm individuals or groups, or incite violence or
              discrimination.
            </li>
            <li>
              Misrepresent your identity, impersonate others, or mislead recipients about
              the origin of communications.
            </li>
            <li>
              Attempt to probe, scan, or test the vulnerability of any system or network
              related to the Services, or bypass security or authentication measures.
            </li>
            <li>
              Reverse engineer, decompile, or attempt to derive source code from the
              Services, except where permitted by law.
            </li>
            <li>
              Interfere with the normal operation of the Services (for example, by
              introducing malware, running abusive scripts, or overloading our
              infrastructure).
            </li>
          </ul>
          <p>
            You are solely responsible for: (i) the content you send or publish using the
            Services; (ii) obtaining necessary consents from your contacts and end users;
            and (iii) configuring your campaigns, chatbots, and data retention in a way
            that complies with all applicable laws and industry rules.
          </p>
        </section>

        {/* 6. Third-Party Platforms & WhatsApp Usage */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">6. Third-Party Platforms &amp; WhatsApp Usage</h2>
          <p>
            PromoHubAI connects with third-party services and messaging channels
            (collectively, &quot;Third-Party Platforms&quot;), such as WhatsApp, Meta products, email
            providers, CRMs, or e-commerce platforms.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Your use of Third-Party Platforms is governed by their own terms and privacy
              policies. You are responsible for reviewing and complying with those terms.
            </li>
            <li>
              For WhatsApp and other Meta services, you must comply with their current
              terms, policies, and rate limits (including any business, commerce, or
              messaging rules).
            </li>
            <li>
              We do not control Third-Party Platforms and are not liable for their
              availability, performance, or actions.
            </li>
            <li>
              Changes made by Third-Party Platforms (for example, pricing, policies,
              approvals, or API behaviour) may impact how the Services function. We are not
              responsible for such external changes.
            </li>
          </ul>
        </section>

        {/* 7. Data, Privacy & Customer Content */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">7. Data, Privacy &amp; Customer Content</h2>
          <p>
            Our handling of personal data is described in our{" "}
            <a
              href="/privacy"
              className="font-medium text-indigo-600 underline-offset-2 hover:underline"
            >
              Privacy Policy
            </a>
            , which forms part of these Terms.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              You retain ownership of the content, data, and information that you or your
              end users submit to or through the Services (&quot;Customer Content&quot;).
            </li>
            <li>
              You grant us a limited, non-exclusive, worldwide licence to host, store,
              process, transmit, display, and otherwise use Customer Content solely to
              operate, maintain, secure, and improve the Services and to comply with legal
              obligations.
            </li>
            <li>
              You represent and warrant that you have all rights and permissions to upload,
              store, and process Customer Content (including end-user data) through the
              Services.
            </li>
            <li>
              If you are subject to specific regulatory or sectoral rules (e.g., financial,
              medical, or government sector), you are responsible for verifying that the
              use of PromoHubAI is appropriate for your compliance obligations.
            </li>
          </ul>
        </section>

        {/* 8. AI-Generated Outputs */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">8. AI-Generated Content &amp; Recommendations</h2>
          <p>
            Some features of PromoHubAI use machine learning and large language models to
            generate or suggest text, replies, campaign content, or insights.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              AI outputs are generated based on patterns and inputs and may sometimes be
              incomplete, inaccurate, or not suitable for your specific context.
            </li>
            <li>
              You are responsible for reviewing and approving AI-generated content before
              sending, publishing, or relying on it.
            </li>
            <li>
              We do not guarantee any particular outcome, performance, or conversion rate
              from AI-generated suggestions.
            </li>
          </ul>
        </section>

        {/* 9. Intellectual Property */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">9. Intellectual Property</h2>
          <p>
            The Services, including their design, software, code, user interfaces, logos,
            and all related intellectual property rights, are owned by IdThrivo Technology
            Sdn Bhd or its licensors.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              You are granted a limited, revocable, non-exclusive, non-transferable licence
              to use the Services during your subscription, solely in accordance with these
              Terms.
            </li>
            <li>
              You may not copy, modify, distribute, sell, lease, or create derivative works
              based on the Services, except as expressly permitted by us in writing.
            </li>
            <li>
              Feedback, suggestions, or ideas you share with us may be used to improve the
              Services without obligation to you. You grant us a perpetual, royalty-free
              licence to use such feedback.
            </li>
          </ul>
        </section>

        {/* 10. Beta Features / Preview Access */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">10. Beta Features &amp; Early Access</h2>
          <p>
            From time to time, we may offer features labelled as &quot;beta,&quot; &quot;preview,&quot;
            &quot;early access,&quot; or similar.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Such features may be offered for evaluation purposes, may change without
              notice, and may be withdrawn at any time.
            </li>
            <li>
              Beta features are provided &quot;as is&quot; without any warranties and may not be
              covered by standard support or SLAs.
            </li>
          </ul>
        </section>

        {/* 11. Disclaimers */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">11. Disclaimers</h2>
          <p>
            To the fullest extent permitted by law, the Services are provided on an &quot;as
            is&quot; and &quot;as available&quot; basis.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              We do not make any guarantees regarding uptime, performance, or error-free
              operation, although we aim to provide a reliable service.
            </li>
            <li>
              We disclaim all warranties, express or implied, including any implied
              warranties of merchantability, fitness for a particular purpose, and
              non-infringement.
            </li>
            <li>
              We do not guarantee specific marketing, sales, or business outcomes arising
              from your use of the Services.
            </li>
          </ul>
        </section>

        {/* 12. Limitation of Liability */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">12. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, neither PromoHubAI nor its directors,
            employees, or partners shall be liable for:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Any indirect, incidental, consequential, special, or punitive damages,
              including loss of profits, revenue, data, or business opportunities.
            </li>
            <li>
              Any loss or damage resulting from your use of, or inability to use, the
              Services, or from unauthorised access to your account which is not solely due
              to our fault.
            </li>
          </ul>
          <p>
            In all cases, our aggregate liability for claims arising out of or related to
            the Services or these Terms shall not exceed the total amount of fees you paid
            to us for the Services in the twelve (12) months immediately preceding the
            event giving rise to the claim.
          </p>
        </section>

        {/* 13. Indemnity */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">13. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless IdThrivo Technology Sdn Bhd
            and its officers, directors, employees, and agents from and against any claims,
            damages, losses, liabilities, costs, and expenses (including reasonable legal
            fees) arising out of or related to:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Your use of the Services in violation of these Terms or applicable law.</li>
            <li>
              Customer Content or communications you send using the Services, including any
              allegation that such content infringes or violates the rights of a third
              party.
            </li>
            <li>Your misuse of WhatsApp or other Third-Party Platforms connected to the Services.</li>
          </ul>
        </section>

        {/* 14. Suspension & Termination */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">14. Suspension &amp; Termination</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              You may terminate your subscription or close your account at any time via the
              account settings or by contacting us.
            </li>
            <li>
              We may suspend or terminate your access if: (i) you materially breach these
              Terms; (ii) you fail to pay fees when due; (iii) we are required to do so by
              law; or (iv) your use poses a security, legal, or reputational risk.
            </li>
            <li>
              Upon termination, your right to use the Services ceases. Certain provisions
              that by their nature should survive (such as intellectual property,
              limitations of liability, and indemnification) will continue to apply.
            </li>
            <li>
              We may retain limited information as required by law or for legitimate
              business purposes (for example, accounting records), in line with our Privacy
              Policy.
            </li>
          </ul>
        </section>

        {/* 15. Governing Law & Disputes */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">15. Governing Law &amp; Dispute Resolution</h2>
          <p>
            These Terms and any dispute or claim arising out of or in connection with them
            or the Services shall be governed by and construed in accordance with the laws
            of Malaysia, without giving effect to any conflict of law principles.
          </p>
          <p>
            You agree that the courts of Kuala Lumpur, Malaysia shall have exclusive
            jurisdiction over any legal proceedings arising out of or relating to these
            Terms or the Services, unless a different forum is required by mandatory law.
          </p>
        </section>

        {/* 16. Changes to These Terms */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">16. Changes to These Terms</h2>
          <p>
            We may revise these Terms from time to time, for example to reflect changes in
            our Services, our business, or applicable laws.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              When we make material updates, we will update the &quot;Last updated&quot; date at the
              top of this page and may provide additional notice (for example, in-app or by
              email).
            </li>
            <li>
              Continued use of the Services after updated Terms become effective constitutes
              your acceptance of the revised Terms. If you do not agree to the changes, you
              should stop using the Services and may close your account.
            </li>
          </ul>
        </section>

        {/* 17. Miscellaneous */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">17. Miscellaneous</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              If any provision of these Terms is found to be invalid or unenforceable, the
              remaining provisions will remain in full force and effect.
            </li>
            <li>
              Our failure to enforce any right or provision under these Terms shall not be
              deemed a waiver of such right or provision.
            </li>
            <li>
              You may not assign or transfer your rights or obligations under these Terms
              without our prior written consent. We may assign our rights and obligations
              in connection with a merger, acquisition, or sale of assets, or by operation
              of law.
            </li>
          </ul>
        </section>

        {/* 18. Contact */}
        <section className="mt-10 mb-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">18. Contact Us</h2>
          <p>
            If you have questions about these Terms or the Services, you can contact us at:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Email:</strong> support@promohubai.com
            </li>
            <li>
              <strong>Company:</strong> IdThrivo Technology Sdn Bhd (1210868-T)
              <br />
              Innovation Incubation Centre, Unit 21 1st Floor, Resource Centre,
              Technology Park Malaysia, Lebuhraya Sg. Besi – Puchong, Bukit Jalil,
              57000 Kuala Lumpur, Malaysia.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
