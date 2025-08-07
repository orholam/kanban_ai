import React from 'react';
import SEO from '../components/SEO';

const TermsOfService: React.FC = () => {
    return (
        <>
            <SEO 
                title="Terms of Service - Kanban AI"
                description="Read our terms of service to understand the rules and guidelines for using Kanban AI. Learn about your rights and responsibilities as a user."
                keywords="terms of service, user agreement, kanban AI, project management, terms and conditions"
                url="https://kanbanai.dev/terms-of-service"
            />
            <div className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
                <p className="mb-6">Last updated: January 15, 2024</p>
                
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                    <p className="mb-4">
                        By accessing and using Kanban AI ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                    <p className="mb-4">
                        Kanban AI is an AI-powered project management platform that helps users plan, track, and complete their side projects. The service includes:
                    </p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>AI-powered project planning and task generation</li>
                        <li>Kanban board management and task tracking</li>
                        <li>Progress analytics and insights</li>
                        <li>Personalized AI recommendations</li>
                        <li>Collaboration features</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                    <p className="mb-4">
                        You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
                    <p className="mb-4">You agree not to use the Service to:</p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>Violate any applicable laws or regulations</li>
                        <li>Infringe upon the rights of others</li>
                        <li>Upload or transmit malicious code or content</li>
                        <li>Attempt to gain unauthorized access to the Service</li>
                        <li>Use the Service for commercial purposes without permission</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
                    <p className="mb-4">
                        The Service and its original content, features, and functionality are and will remain the exclusive property of Kanban AI and its licensors. The Service is protected by copyright, trademark, and other laws.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">6. Privacy Policy</h2>
                    <p className="mb-4">
                        Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
                    <p className="mb-4">
                        In no event shall Kanban AI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
                    <p className="mb-4">
                        We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
                    <p className="mb-4">
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
                    <p className="mb-4">
                        If you have any questions about these Terms of Service, please contact us at:
                    </p>
                    <p className="mb-4">
                        Email: legal@kanbanai.dev<br/>
                        Address: [Your Business Address]
                    </p>
                </section>
            </div>
        </>
    );
};

export default TermsOfService;
