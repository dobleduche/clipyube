import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 text-gray-300">
      <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 text-center font-oswald text-gradient-cyan-sanguine">
        Privacy Policy
      </h2>
      <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl space-y-6 prose prose-lg max-w-none text-slate-300">
        <p>
          This Privacy Policy describes how your personal information is collected, used, and shared
          when you use Clip-Yube (the &quot;App&quot;).
        </p>

        <h3>Information We Collect</h3>
        <p>
          When you use the App, we automatically collect certain information about your device and
          usage. However, the core functionality of our app is designed to respect your privacy:
        </p>
        <ul>
          <li>
            <strong>Uploaded Images &amp; Prompts:</strong> Images and prompts you provide for
            editing are sent to third-party AI service providers (like Google&apos;s Gemini) to
            process your request. We do not store your images or prompts on our servers after the
            processing is complete.
          </li>
          <li>
            <strong>Locally Stored Data:</strong> Your session state, generated content like blog
            posts, and other preferences are stored locally in your browser&apos;s localStorage.
            This data is not transmitted to our servers and is under your control.
          </li>
          <li>
            <strong>Analytics:</strong> We may collect anonymous usage data to help us improve the
            App. This includes information like features used and session duration, but does not
            include personal identifiers or your creative content.
          </li>
        </ul>

        <h3>How We Use Your Information</h3>
        <p>We use the information we collect in order to:</p>
        <ul>
          <li>Provide and maintain the App&apos;s functionality.</li>
          <li>Improve, personalize, and expand our App.</li>
          <li>Understand and analyze how you use our App.</li>
          <li>Communicate with you for customer service or to provide you with updates.</li>
        </ul>

        <h3>Sharing Your Information</h3>
        <p>
          We do not sell your personal information. We may share information with third-party
          service providers only as necessary to provide the App&apos;s functionality (e.g., sending
          data to the Gemini API for image processing). These third parties are obligated to protect
          your information.
        </p>

        <h3>Your Rights</h3>
        <p>
          You have the right to access personal information we hold about you and to ask that your
          personal information be corrected, updated, or deleted. As most of your data is stored
          locally, you can clear this by clearing your browser&apos;s cache and local storage for
          our site.
        </p>

        <h3>Changes</h3>
        <p>
          We may update this privacy policy from time to time in order to reflect, for example,
          changes to our practices or for other operational, legal or regulatory reasons.
        </p>

        <h3>Contact Us</h3>
        <p>
          For more information about our privacy practices, if you have questions, or if you would
          like to make a complaint, please contact us by e-mail at{' '}
          <a href="mailto:privacy@clipyube.info">privacy@clipyube.info</a>.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;
