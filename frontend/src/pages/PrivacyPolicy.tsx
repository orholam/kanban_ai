import React from 'react';
import SEO from '../components/SEO';

const PrivacyPolicy: React.FC = () => {
    return (
        <>
            <SEO
                title="Privacy Policy — Kanban AI | Data & AI kanban app"
                description="How Kanban AI handles data for your AI kanban boards and account: what we collect, why we use it, and your choices."
                keywords="Kanban AI privacy, kanban AI data, privacy policy"
                url="https://kanbanai.dev/privacy-policy"
            />
            <div className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
                <p className="mb-6">Last updated: July 18, 2026</p>
                
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
                    <p className="mb-4">
                        Kanban AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered project management platform.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
                    <h3 className="text-xl font-medium mb-2">Personal Information</h3>
                    <ul className="list-disc pl-6 mb-4">
                        <li>Name and email address when you create an account</li>
                        <li>Profile information and preferences</li>
                        <li>Project data and task information</li>
                        <li>Usage data and analytics</li>
                    </ul>
                    
                    <h3 className="text-xl font-medium mb-2">Technical Information</h3>
                    <ul className="list-disc pl-6 mb-4">
                        <li>IP address and device information</li>
                        <li>Browser type and version</li>
                        <li>Operating system</li>
                        <li>Usage patterns and interactions</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
                    <ul className="list-disc pl-6 mb-4">
                        <li>Provide and maintain our services</li>
                        <li>Personalize your experience and AI recommendations</li>
                        <li>Improve our platform and develop new features</li>
                        <li>Communicate with you about updates and changes</li>
                        <li>Ensure security and prevent fraud</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                    <p className="mb-4">
                        We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Advertising</h2>
                    <p className="mb-4">
                        We use Google AdSense to display ads on Kanban AI. Google and its partners may use cookies or similar technologies to serve ads based on your prior visits to this site or other sites. You can learn more about how Google uses data when you use our site, and manage ad personalization, at{' '}
                        <a
                            href="https://policies.google.com/technologies/partner-sites"
                            className="text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Google&apos;s Partner Sites Policy
                        </a>
                        .
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
                    <p className="mb-4">
                        We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law. Advertising partners such as Google may receive technical information (for example, cookies and device data) as described under Advertising above.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
                    <p className="mb-4">You have the right to:</p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>Access your personal information</li>
                        <li>Correct inaccurate data</li>
                        <li>Request deletion of your data</li>
                        <li>Object to processing of your data</li>
                        <li>Data portability</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                    <p className="mb-4">
                        If you have any questions about this Privacy Policy or our data practices, please contact us at:
                    </p>
                    <p className="mb-4">
                        Email: privacy@kanbanai.dev<br/>
                        Address: [Your Business Address]
                    </p>
                </section>
            </div>
        </>
    );
};

export default PrivacyPolicy;
