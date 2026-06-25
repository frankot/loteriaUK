import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="bg-cream px-4 md:px-8 lg:px-12 py-10 md:py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif mb-2 text-3xl md:text-4xl font-semibold text-ink">
          Privacy Policy
        </h1>
        <p className="mb-1 text-sm text-ink-muted">Golden Dream Draw</p>
        <p className="mb-8 md:mb-10 text-sm text-ink-muted">
          <a href="https://www.goldendreamdraw.uk" className="text-gold-dark hover:underline">www.goldendreamdraw.uk</a>
          <br />
          Last updated: June 2025
        </p>

        <div className="space-y-8 text-[14px] md:text-[15px] leading-relaxed text-ink-soft">
          {/* 1 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">1. About Us</h2>
            <p className="mb-2">
              Golden Dream Draw is a skill-based prize competition business operated as a sole trader in England and Wales. Our website is located at www.goldendreamdraw.uk.
            </p>
            <p className="mb-2">
              For the purposes of data protection law, we act as the Data Controller in respect of any personal data we collect from you.
            </p>
            <p>
              <strong>Contact details:</strong><br />
              Golden Dream Draw<br />
              Email: <a href="mailto:contact@goldendreamdraw.uk" className="text-gold-dark hover:underline">contact@goldendreamdraw.uk</a><br />
              Website: <a href="https://www.goldendreamdraw.uk" className="text-gold-dark hover:underline">www.goldendreamdraw.uk</a>
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">2. What This Policy Covers</h2>
            <p className="mb-2">
              This Privacy Policy explains how we collect, use, store and share your personal data when you:
            </p>
            <ul className="mb-2 list-disc pl-5 space-y-1">
              <li>Visit our website at www.goldendreamdraw.uk</li>
              <li>Register an account with us</li>
              <li>Purchase tickets for any of our competitions</li>
              <li>Contact us or communicate with us by any means</li>
              <li>Subscribe to our marketing communications</li>
            </ul>
            <p>
              Please read this policy carefully. By using our website or services, you acknowledge that you have read and understood how we handle your personal data.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">3. What Personal Data We Collect</h2>

            <h3 className="font-medium mb-1 text-ink">3.1 Account Registration and Ticket Purchases</h3>
            <ul className="mb-3 list-disc pl-5 space-y-1">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Date of birth (to verify that you are aged 18 or over)</li>
              <li>Billing and delivery address</li>
              <li>Payment details (processed securely by Cashflows; we do not store full card details)</li>
              <li>Competition entries and ticket numbers</li>
            </ul>

            <h3 className="font-medium mb-1 text-ink">3.2 Website Usage Data</h3>
            <ul className="mb-3 list-disc pl-5 space-y-1">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device type and operating system</li>
              <li>Pages viewed and time spent on site</li>
              <li>Referring website or link</li>
              <li>Cookie data (see Section 9)</li>
            </ul>

            <h3 className="font-medium mb-1 text-ink">3.3 Communications</h3>
            <ul className="mb-3 list-disc pl-5 space-y-1">
              <li>Records of emails, enquiries or messages you send us</li>
              <li>Responses to any surveys or feedback forms</li>
            </ul>

            <h3 className="font-medium mb-1 text-ink">3.4 Marketing</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your marketing preferences and consent</li>
              <li>Engagement data from marketing emails (e.g. opens and clicks)</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">4. How We Use Your Personal Data</h2>
            <p className="mb-2">We use your personal data for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and manage your account on our website</li>
              <li>To process your ticket purchases and competition entries</li>
              <li>To verify your age and eligibility to enter our competitions (must be 18+, UK residents only)</li>
              <li>To administer competitions, select winners and coordinate prize delivery</li>
              <li>To process payments securely via Cashflows</li>
              <li>To send you order confirmations, ticket numbers and competition updates</li>
              <li>To respond to your enquiries and provide customer support</li>
              <li>To publish winners&apos; first name and first initial of surname on our website and social media (as required by our competition rules)</li>
              <li>To send you marketing communications if you have opted in to receive them</li>
              <li>To comply with our legal and regulatory obligations</li>
              <li>To prevent fraud and ensure the security of our website</li>
              <li>To improve our website, products and services through analytics</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">5. Legal Basis for Processing</h2>
            <p className="mb-2">We rely on the following legal bases under UK GDPR to process your personal data:</p>
            <p className="mb-1"><strong>Contract:</strong> Processing is necessary to fulfil our contract with you (e.g. processing your ticket purchase and running the competition).</p>
            <p className="mb-1"><strong>Legal Obligation:</strong> Where we are required to process your data to comply with a legal obligation (e.g. financial record-keeping, age verification).</p>
            <p className="mb-1"><strong>Legitimate Interests:</strong> Where processing is in our legitimate interests, for example to detect and prevent fraud, improve our services and manage the security of our website.</p>
            <p><strong>Consent:</strong> Where you have given us explicit consent, for example to send you marketing emails. You may withdraw this consent at any time.</p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">6. Sharing Your Personal Data</h2>
            <p className="mb-2">We do not sell or rent your personal data to any third party. We will only share your data in the following limited circumstances:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cashflows:</strong> Our payment processor. Cashflows processes your payment securely. Please see Cashflows&apos; privacy policy.</li>
              <li><strong>Hosting &amp; IT providers:</strong> We use Vercel to host our website. They act as a data processor on our behalf and are bound by appropriate data protection agreements.</li>
              <li><strong>Email marketing:</strong> We may use an email service provider to manage marketing communications. They process data only on our instruction.</li>
              <li><strong>Meta Platforms (Facebook/Instagram):</strong> We use Meta Pixel on our website for advertising purposes. Meta may process data in accordance with their own privacy policy.</li>
              <li><strong>Legal requirements:</strong> We may disclose your information where required to do so by law, or where we reasonably believe such disclosure is necessary to protect our rights, protect your safety, or investigate fraud.</li>
            </ul>
            <p className="mt-2">All third parties who process personal data on our behalf are required to keep your data secure and to use it only for the specified purposes.</p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">7. International Transfers</h2>
            <p>
              Some of our third-party service providers may be based or process data outside of the UK or European Economic Area (EEA). Where this occurs, we ensure that appropriate safeguards are in place, such as the use of Standard Contractual Clauses approved by the ICO, to ensure your data remains protected to the same standards as required under UK GDPR.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">8. Data Retention</h2>
            <p className="mb-2">We will only keep your personal data for as long as is necessary to fulfil the purposes for which it was collected, including to satisfy any legal, accounting or reporting requirements.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account data: retained for as long as you maintain an active account with us, plus a reasonable period thereafter</li>
              <li>Transaction and competition records: retained for 7 years to comply with HMRC financial record-keeping requirements</li>
              <li>Marketing consent records: retained until you withdraw consent, plus 1 year thereafter</li>
              <li>Website analytics data: retained for up to 26 months</li>
            </ul>
            <p className="mt-2">When your data is no longer required, it will be securely deleted or anonymised.</p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">9. Cookies</h2>
            <p className="mb-2">
              Our website uses cookies — small text files placed on your device — to improve your browsing experience and to enable us to analyse site usage and deliver relevant advertising.
            </p>
            <p className="mb-2">We use the following types of cookies:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Essential cookies: necessary for the website to function (e.g. maintaining your login session and shopping basket)</li>
              <li>Analytics cookies: to understand how visitors use our site</li>
              <li>Advertising/tracking cookies: including the Meta Pixel, to measure the effectiveness of our adverts and show relevant ads on Facebook and Instagram</li>
            </ul>
            <p className="mt-2">
              You can manage or disable cookies through your browser settings at any time. Please note that disabling certain cookies may affect the functionality of our website. A full cookie policy and consent mechanism is available on our website.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">10. Your Rights</h2>
            <p className="mb-2">Under UK GDPR, you have the following rights in respect of your personal data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Right of Access:</strong> You may request a copy of the personal data we hold about you (a Subject Access Request).</li>
              <li><strong>Right to Rectification:</strong> You may ask us to correct any inaccurate or incomplete personal data.</li>
              <li><strong>Right to Erasure:</strong> You may ask us to delete your personal data where it is no longer necessary for the purposes for which it was collected, subject to certain legal exceptions.</li>
              <li><strong>Right to Restriction:</strong> You may ask us to restrict the processing of your data in certain circumstances.</li>
              <li><strong>Right to Data Portability:</strong> You have the right to receive your personal data in a structured, commonly used and machine-readable format.</li>
              <li><strong>Right to Object:</strong> You may object to the processing of your data where we rely on legitimate interests as our legal basis.</li>
              <li><strong>Right to Withdraw Consent:</strong> Where we process your data on the basis of consent, you may withdraw that consent at any time. Withdrawal does not affect the lawfulness of processing prior to withdrawal.</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us at <a href="mailto:contact@goldendreamdraw.uk" className="text-gold-dark hover:underline">contact@goldendreamdraw.uk</a>. We will respond to your request within one calendar month. We may need to verify your identity before processing your request.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">11. Marketing Communications</h2>
            <p className="mb-2">
              We will only send you marketing emails, SMS messages or other promotional communications if you have given us your explicit consent to do so.
            </p>
            <p className="mb-2">You can opt out of receiving marketing communications at any time by:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Clicking the &apos;Unsubscribe&apos; link at the bottom of any marketing email</li>
              <li>Contacting us at <a href="mailto:contact@goldendreamdraw.uk" className="text-gold-dark hover:underline">contact@goldendreamdraw.uk</a> and requesting to be removed</li>
              <li>Updating your preferences in your account settings on our website</li>
            </ul>
            <p className="mt-2">
              Please note that even if you opt out of marketing, we may still send you transactional or service-related messages such as order confirmations, ticket receipts and competition updates.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">12. Children</h2>
            <p>
              Our competitions are strictly open to persons aged 18 and over. We do not knowingly collect personal data from anyone under the age of 18. If you believe we may have inadvertently collected data from a minor, please contact us immediately at <a href="mailto:contact@goldendreamdraw.uk" className="text-gold-dark hover:underline">contact@goldendreamdraw.uk</a> and we will delete the data without delay.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">13. Security</h2>
            <p className="mb-2">
              We take the security of your personal data seriously and have implemented appropriate technical and organisational measures to protect it against unauthorised access, loss, destruction or alteration. These include:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>SSL/TLS encryption across our website (HTTPS)</li>
              <li>Secure payment processing via Cashflows (PCI DSS compliant)</li>
              <li>Access controls to restrict who within our business can access your data</li>
              <li>Regular review of our security practices</li>
            </ul>
            <p className="mt-2">
              While we take all reasonable steps to protect your personal data, no method of data transmission over the internet is completely secure. If you have any concerns about data security, please contact us at <a href="mailto:contact@goldendreamdraw.uk" className="text-gold-dark hover:underline">contact@goldendreamdraw.uk</a>.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">14. Links to Other Websites</h2>
            <p>
              Our website may contain links to third-party websites. This Privacy Policy does not apply to those websites. We encourage you to read the privacy policies of any external sites you visit. We are not responsible for the privacy practices or content of third-party websites.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">15. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology or legal obligations. We will post the updated policy on this page with the revised &apos;Last updated&apos; date. We encourage you to review this policy periodically. Where changes are significant, we will take reasonable steps to notify you directly.
            </p>
          </section>

          {/* 16 */}
          <section>
            <h2 className="font-serif mb-2 text-xl md:text-2xl font-semibold text-ink">16. Complaints</h2>
            <p className="mb-2">
              If you are unhappy with how we have handled your personal data, we ask that you contact us in the first instance so that we can try to resolve the matter:
            </p>
            <p className="mb-2">
              Email: <a href="mailto:contact@goldendreamdraw.uk" className="text-gold-dark hover:underline">contact@goldendreamdraw.uk</a>
            </p>
            <p className="mb-2">If you remain unsatisfied, you have the right to lodge a complaint with the UK&apos;s supervisory authority for data protection:</p>
            <p className="mb-1">
              <strong>Information Commissioner&apos;s Office (ICO)</strong><br />
              Website: <a href="https://www.ico.org.uk" className="text-gold-dark hover:underline" target="_blank" rel="noopener noreferrer">www.ico.org.uk</a><br />
              Telephone: 0303 123 1113<br />
              Address: Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-xs text-ink-muted">
          <p>&copy; 2025 Golden Dream Draw &bull; <a href="https://www.goldendreamdraw.uk" className="text-gold-dark hover:underline">www.goldendreamdraw.uk</a> &bull; <a href="mailto:contact@goldendreamdraw.uk" className="text-gold-dark hover:underline">contact@goldendreamdraw.uk</a></p>
        </div>
      </div>
    </div>
  );
}
