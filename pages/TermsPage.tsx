import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 text-gray-300">
      <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 text-center font-oswald text-gradient-cyan-sanguine">Terms of Service</h2>
      <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl space-y-6 prose prose-lg max-w-none text-slate-300">
        <p>By accessing or using Clip-Yube (the "App"), you agree to be bound by these Terms of Service ("Terms").</p>

        <h3>1. Use of the App</h3>
        <p>You agree to use the App only for lawful purposes. You are responsible for any content you upload, generate, or share using the App. You must not use the App to create content that is illegal, harmful, offensive, or infringes on the rights of others, including intellectual property rights.</p>

        <h3>2. Generated Content</h3>
        <p>You retain ownership of the original content you upload to the App. The ownership of AI-generated content is subject to the terms of the underlying AI models (e.g., Google's Gemini API). You are responsible for ensuring you have the rights to use any content you generate.</p>
        <p>We do not claim any ownership rights in the images or videos you create. However, by using the service, you grant us a license to host, store, and process your content as necessary to provide the service to you.</p>

        <h3>3. Disclaimers</h3>
        <p>The App is provided "as is" without any warranties of any kind. We do not guarantee that the service will be uninterrupted or error-free. The output of the AI models can sometimes be unpredictable or inaccurate, and we are not responsible for the content generated.</p>

        <h3>4. Limitation of Liability</h3>
        <p>In no event shall Clip-Yube, its developers, or affiliates be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the App.</p>

        <h3>5. Changes to Terms</h3>
        <p>We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. You are advised to review these Terms periodically for any changes.</p>

        <h3>Contact Us</h3>
        <p>If you have any questions about these Terms, please contact us at <a href="mailto:contact@clipyube.info">contact@clipyube.info</a>.</p>
      </div>
    </div>
  );
};

export default TermsPage;
