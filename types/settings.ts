export type WatermarkSettings = {
  type: 'text' | 'image';
  text: string;
  font: string;
  fontSize: number;
  color: string;
  opacity: number;
  scale: number;
  position:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
};

export type Settings = {
  profileName: string;
  defaultNiche: string;
  twitterHandle: string;
  automationInterval: number; // in milliseconds
  watermarkDefaults: Partial<WatermarkSettings>;
  userTier: 'free' | 'pro';
  billing: {
    plan: string;
    nextBillingDate: string;
  };
  newsletter: {
    email: boolean;
    inApp: boolean;
  };
};
