import React, { useEffect, useState } from "react";
import { ArrowLeftIcon, PrintIcon, DownloadIcon } from "../components/Icons";
import { useAppContext } from "../context/AppContext";
import ShareComponent from "../components/ShareComponent";
import { motion } from "framer-motion";

export type BlogPost = {
  slug: string;
  title: string;
  author: string;
  date: string;
  image: string;
  snippet: string;
  content: string; // HTML content (should be sanitized upstream)
};

interface BlogPageProps {
  posts: BlogPost[];
  slug?: string;
}

const MotionA = motion.a;

// Simple reading time estimator: ~220 wpm, minimum 1 minute
const estimateReadingTime = (html: string): number => {
  // Strip HTML tags
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const wordsPerMinute = 220;
  const minutes = Math.max(1, Math.round(words.length / wordsPerMinute));
  return minutes;
};

const BlogPage: React.FC<BlogPageProps> = ({ posts, slug }) => {
  const { navigateTo } = useAppContext();
  const [postUrl, setPostUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPostUrl(window.location.href);
    }
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    route: string
  ) => {
    e.preventDefault();
    navigateTo(route);
  };

  // Single-post view
  if (slug) {
    const index = posts.findIndex((p) => p.slug === slug);
    const post = index >= 0 ? posts[index] : undefined;

    if (!post) {
      return (
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Post Not Found</h2>
          <p className="text-slate-400 mb-6">
            The blog post you&apos;re looking for doesn&apos;t exist or may have
            been removed.
          </p>
          <a
            href="#/blog"
            onClick={(e) => handleNavClick(e, "#/blog")}
            className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center justify-center gap-2"
          >
            <ArrowLeftIcon />
            Back to Blog
          </a>
        </div>
      );
    }

    const readingTime = estimateReadingTime(post.content);
    const prevPost = index > 0 ? posts[index - 1] : undefined;
    const nextPost = index < posts.length - 1 ? posts[index + 1] : undefined;

    const handlePrint = () => {
      if (typeof window !== "undefined") {
        window.print();
      }
    };

    const handleDownloadDoc = (title: string, content: string) => {
      if (typeof document === "undefined") return;

      const safeSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const filename = `${safeSlug}.doc`;

      // Trick to make Word open the HTML file as a doc.
      const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${title}</title></head><body>`;
      const footer = "</body></html>";
      const sourceHTML = header + `<h1>${title}</h1>` + content + footer;

      const source =
        "data:application/vnd.ms-word;charset=utf-8," +
        encodeURIComponent(sourceHTML);
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = filename;
      fileDownload.click();
      document.body.removeChild(fileDownload);
    };

    return (
      <div className="max-w-4xl mx-auto">
        <a
          href="#/blog"
          onClick={(e) => handleNavClick(e, "#/blog")}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold mb-6 transition-colors non-printable"
        >
          <ArrowLeftIcon />
          Back to All Posts
        </a>

        <article className="bg-slate-900/20 p-8 rounded-2xl border border-white/10 shadow-xl print:shadow-none print:border-0 print:bg-transparent">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 text-slate-400 text-sm mb-6">
            <div className="space-x-2">
              <span>By {post.author}</span>
              <span>&bull;</span>
              <span>{post.date}</span>
              <span>&bull;</span>
              <span>{readingTime} min read</span>
            </div>

            <div className="sharing-controls flex items-center gap-2 non-printable">
              <button
                onClick={handlePrint}
                title="Print or Save as PDF"
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70"
                type="button"
              >
                <PrintIcon />
              </button>
              <button
                onClick={() => handleDownloadDoc(post.title, post.content)}
                title="Download as Word (.doc)"
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70"
                type="button"
              >
                <DownloadIcon />
              </button>
              <ShareComponent url={postUrl} title={post.title} />
            </div>
          </div>

          {post.image && (
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-auto max-h-96 object-cover rounded-xl shadow-lg mb-8 ring-1 ring-white/10 print:shadow-none print:ring-0"
            />
          )}

          <div
            className="prose prose-lg prose-invert max-w-none text-slate-300"
            // Make sure post.content is sanitized before passing in.
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {(prevPost || nextPost) && (
            <nav className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-4 text-sm non-printable">
              {prevPost ? (
                <a
                  href={`#/blog/${prevPost.slug}`}
                  onClick={(e) =>
                    handleNavClick(e, `#/blog/${prevPost.slug}`)
                  }
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold max-w-xs"
                >
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    Previous
                  </span>
                  <span className="truncate">← {prevPost.title}</span>
                </a>
              ) : (
                <span /> // keeps layout balanced when only next exists
              )}

              {nextPost && (
                <a
                  href={`#/blog/${nextPost.slug}`}
                  onClick={(e) =>
                    handleNavClick(e, `#/blog/${nextPost.slug}`)
                  }
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold max-w-xs sm:text-right sm:justify-end"
                >
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    Next
                  </span>
                  <span className="truncate">
                    {nextPost.title} →
                  </span>
                </a>
              )}
            </nav>
          )}
        </article>
      </div>
    );
  }

  // Blog index view
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 font-oswald text-gradient-cyan-sanguine">
          The Clip-Yube Blog
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Insights, tutorials, and inspiration powered by our own AI Content
          Agent.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-slate-400">
          No posts yet. Once your AI agent starts publishing, they&apos;ll show
          up here.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <MotionA
              href={`#/blog/${post.slug}`}
              onClick={(e) => handleNavClick(e, `#/blog/${post.slug}`)}
              key={post.slug}
              className="block bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden group transition-colors duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70"
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              {post.image && (
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-56 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {post.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4">{post.date}</p>
                <p className="text-slate-300 line-clamp-3">{post.snippet}</p>
              </div>
            </MotionA>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogPage;
