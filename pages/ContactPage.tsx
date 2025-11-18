import React from "react";
import { MailIcon, SupportIcon } from "../components/Icons";

const ContactPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 text-gray-300">
      <header className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 font-oswald text-gradient-cyan-sanguine">
          Get In Touch
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Questions, feedback, or ideas? Reach out and we’ll get back as soon as we can.
        </p>
      </header>

      <main className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 sm:p-8 rounded-2xl shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <section
          className="flex flex-col items-center text-center p-6 bg-black/20 rounded-lg ring-1 ring-white/10"
          aria-labelledby="contact-general-heading"
        >
          <div className="p-4 bg-cyan-500/10 rounded-full mb-4" aria-hidden="true">
            <MailIcon />
          </div>
          <h3
            id="contact-general-heading"
            className="text-xl font-bold text-white mb-2"
          >
            General Inquiries
          </h3>
          <p className="text-slate-400 mb-4">
            For partnerships, media, and general questions.
          </p>
          <a
            href="mailto:contact@clipyube.info"
            className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded"
          >
            contact@clipyube.info
          </a>
        </section>

        <section
          className="flex flex-col items-center text-center p-6 bg-black/20 rounded-lg ring-1 ring-white/10"
          aria-labelledby="contact-support-heading"
        >
          <div className="p-4 bg-cyan-500/10 rounded-full mb-4" aria-hidden="true">
            <SupportIcon />
          </div>
          <h3
            id="contact-support-heading"
            className="text-xl font-bold text-white mb-2"
          >
            Technical Support
          </h3>
          <p className="text-slate-400 mb-4">
            Need help with the app? Found a bug? Let us know.
          </p>
          <a
            href="mailto:support@clipyube.info"
            className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded"
          >
            support@clipyube.info
          </a>
        </section>
      </main>
    </div>
  );
};

export default ContactPage;
