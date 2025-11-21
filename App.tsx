
import React from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ImageEditor } from './components/ImageEditor';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ViralAgentPage from './pages/ViralAgentPage';
import BlogPage from './pages/BlogPage';
import LandingPage from './pages/LandingPage';
import DocsFaqPage from './pages/DocsFaqPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import SettingsPage from './pages/SettingsPage';
import AutomationDashboardPage from './pages/AutomationDashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import ClipYubePage from './pages/ClipYubePage';
import SmokeTestPage from './pages/SmokeTestPage';
import { useAppContext } from './context/AppContext';
import { useSettings } from './context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import CookieConsentBanner from './components/CookieConsentBanner';
import UpgradeModal from './components/UpgradeModal';

const MotionDiv = motion.div;

const App: React.FC = () => {
  const { route, blogPosts, isUpgradeModalOpen, closeUpgradeModal } = useAppContext();
  const { settings } = useSettings();
  
  const isLandingPage = route === '/' || route === '#/';

  const renderContent = () => {
    if (route.startsWith('#/blog/')) {
        const slug = route.split('#/blog/')[1];
        return <BlogPage posts={blogPosts} slug={slug} />;
    }

    switch (route) {
      case '#/about':
        return <AboutPage />;
      case '#/contact':
        return <ContactPage />;
      case '#/docs-faq':
        return <DocsFaqPage />;
      case '#/viral-agent':
        return <ViralAgentPage />;
      case '#/clipyube':
        return <ClipYubePage />;
      case '#/blog':
        return <BlogPage posts={blogPosts} />;
      case '#/privacy':
        return <PrivacyPage />;
      case '#/terms':
        return <TermsPage />;
      case '#/settings':
        return <SettingsPage />;
      case '#/automation':
        return <AutomationDashboardPage />;
      case '#/workspace':
        return <WorkspacePage />;
      case '#/smoke-test':
        return <SmokeTestPage />;
      case '#/editor':
        return (
          <>
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2 font-oswald tracking-wide text-gradient-cyan-sanguine">AI Image &amp; Video Editor</h2>
              <p className="text-lg text-gray-400">Bring your creative visions to life with a simple text prompt.</p>
            </div>
            <ImageEditor />
          </>
        );
      case '/':
      case '#/':
      default:
        return <LandingPage />;
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
  } as const;

  return (
    <div className="min-h-screen text-gray-200 flex flex-col">
      <Navbar />
      <main className={`flex-grow w-full ${!isLandingPage ? 'container mx-auto p-4 md:p-8' : ''}`}>
         {!isLandingPage && settings.profileName && (
            <p className="text-right text-slate-400 mb-4 -mt-2">Welcome back, {settings.profileName}!</p>
         )}
        <AnimatePresence mode="wait">
            <MotionDiv
                key={route}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
            >
                {renderContent()}
            </MotionDiv>
        </AnimatePresence>
      </main>
      <Footer />
      <CookieConsentBanner />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={closeUpgradeModal} />
    </div>
  );
};

export default App;
