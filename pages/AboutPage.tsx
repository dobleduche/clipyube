import React from "react";

const AboutPage: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto py-8 text-gray-300">
      <header className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 font-oswald text-gradient-cyan-sanguine">
          About Clip-Yube
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          The AI-powered studio that turns ideas into ready-to-publish content —
          without the friction.
        </p>
      </header>

      <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl space-y-8">
        <section>
          <h3 className="text-2xl font-bold text-white mb-3">
            Our Mission: Creativity, Unleashed
          </h3>
          <p className="text-lg leading-relaxed mb-3">
            Clip-Yube was born from a simple yet powerful idea: creativity
            should be effortless, instant, and accessible to everyone. We saw a
            world filled with complex editing software that demanded hours of
            tutorials and technical expertise, creating a barrier between a
            great idea and its final expression.
          </p>
          <p className="text-lg leading-relaxed">
            Our mission is to tear down that barrier. We&apos;re building a
            creative suite that operates at the speed of thought, allowing
            creators, marketers, designers, and enthusiasts to bring their most
            ambitious visual ideas to life using the power of natural language.
          </p>
        </section>

        <div className="border-t border-white/10" />

        <section>
          <h3 className="text-2xl font-bold text-white mb-3">
            The Technology Under the Hood
          </h3>
          <p className="text-lg leading-relaxed mb-4">
            Clip-Yube isn&apos;t just a tool; it&apos;s an intelligent creative
            partner. We achieve this by integrating a suite of state-of-the-art
            generative AI models, each specialized for a different part of the
            creative process.
          </p>
          <ul className="space-y-3 text-lg">
            <li>
              <strong className="text-cyan-400 font-semibold">
                Gemini 2.5 Flash Image:
              </strong>{" "}
              At the core of our editor is Google&apos;s revolutionary
              multimodal model. It doesn&apos;t just see pixels; it understands
              concepts. This allows you to perform complex edits—like changing
              an object&apos;s material, altering the time of day, or adding
              fantastical elements—with simple text prompts. Its speed and
              efficiency mean you can iterate on ideas in seconds, not hours.
            </li>
            <li>
              <strong className="text-cyan-400 font-semibold">
                Veo Video Generation:
              </strong>{" "}
              For turning static ideas into dynamic stories, we harness the
              power of Veo. This model excels at creating high-definition,
              coherent video clips from text descriptions. It understands
              cinematic language, allowing you to specify camera movements,
              character actions, and artistic styles to generate truly
              compelling short-form videos for social media, ads, or
              presentations.
            </li>
            <li>
              <strong className="text-cyan-400 font-semibold">
                The Automation Engine:
              </strong>{" "}
              Our unique value lies in orchestrating these powerful models into
              a seamless workflow. The Automation Engine combines trend analysis
              models, long-form text generators for blog posts, and the
              image/video models into a cohesive pipeline. It&apos;s your
              personal content factory, working in the background to discover
              ideas and produce first drafts, letting you focus on the final,
              human touch.
            </li>
          </ul>
        </section>

        <div className="border-t border-white/10" />

        <section>
          <h3 className="text-2xl font-bold text-white mb-3">
            Our Features: A Unified Creative Suite
          </h3>
          <p className="text-lg leading-relaxed mb-4">
            Clip-Yube is more than just an editor. It&apos;s an end-to-end
            solution for modern content creation:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/20 p-4 rounded-lg ring-1 ring-white/10">
              <h4 className="font-bold text-white text-xl mb-1">
                Conversational Editor
              </h4>
              <p className="text-slate-300">
                The heart of our platform. Edit images and generate videos with
                text. No sliders, no layers — just your imagination.
              </p>
            </div>
            <div className="bg-black/20 p-4 rounded-lg ring-1 ring-white/10">
              <h4 className="font-bold text-white text-xl mb-1">
                Viral Content Agent
              </h4>
              <p className="text-slate-300">
                Your AI research assistant. It scours trends to find
                high-potential topics, giving you a data-driven head start on
                content that can actually move the needle.
              </p>
            </div>
            <div className="bg-black/20 p-4 rounded-lg ring-1 ring-white/10">
              <h4 className="font-bold text-white text-xl mb-1">
                Automation Dashboard
              </h4>
              <p className="text-slate-300">
                Set your content strategy on autopilot. Monitor the AI as it
                discovers ideas, drafts posts, and feeds your publishing
                pipeline.
              </p>
            </div>
            <div className="bg-black/20 p-4 rounded-lg ring-1 ring-white/10">
              <h4 className="font-bold text-white text-xl mb-1">
                Workspace Hub
              </h4>
              <p className="text-slate-300">
                Your central command center. Access all your generated blog
                posts, saved projects, and experiments in one organized place.
              </p>
            </div>
          </div>
        </section>

        <div className="border-t border-white/10" />

        <section>
          <h3 className="text-2xl font-bold text-white mb-3">
            Built for the Modern Creator
          </h3>
          <p className="text-lg leading-relaxed mb-3">
            Clip-Yube is designed for people who want to ship more without
            burning out:
          </p>
          <ul className="list-disc list-inside space-y-2 text-lg text-slate-300">
            <li>Solo creators and entrepreneurs growing their audience.</li>
            <li>
              Agencies and teams who need repeatable, high-volume content
              workflows.
            </li>
            <li>
              Brands that want consistent, on-brand visuals across every
              channel.
            </li>
          </ul>
          <p className="text-lg leading-relaxed mt-4">
            Underneath the automation, we keep a simple philosophy:{" "}
            <span className="text-cyan-400 font-semibold">
              AI handles the heavy lifting, humans make it unforgettable.
            </span>
          </p>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;
