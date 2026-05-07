// ldvs.js — LDVS scoring algorithm + bilingual recommendations

const WEIGHTS = {
  profile:        0.20,
  posting:        0.20,
  engagement:     0.25,
  responsiveness: 0.20,
  platform:       0.15,
};

function computeLDVS(metrics) {
  const profileScore       = Math.min(100, Math.round((metrics.profileFields / (metrics.totalFields || 5)) * 100));
  const postingScore       = Math.min(100, Math.round(((metrics.postsLast30Days || 0) / 12) * 100));
  const engRate            = (metrics.numPosts || 0) > 0 ? (metrics.totalInteractions || 0) / metrics.numPosts : 0;
  const engagementScore    = Math.min(100, Math.round((engRate / 0.035) * 100));
  const responsivenessScore= Math.max(0, Math.round(100 - (((metrics.avgResponseHours || 24) / 24) * 100)));
  const platformScore      = Math.min(100, Math.round(((metrics.connectedPlatforms || 0) / 5) * 100));

  const ldvs = Math.round(
    profileScore        * WEIGHTS.profile +
    postingScore        * WEIGHTS.posting +
    engagementScore     * WEIGHTS.engagement +
    responsivenessScore * WEIGHTS.responsiveness +
    platformScore       * WEIGHTS.platform
  );

  return { ldvs, profileScore, postingScore, engagementScore, responsivenessScore, platformScore };
}

function classifyLDVS(score) {
  if (score >= 80) return { grade: 'Strong',     color: '#10b981', bg: '#d1fae5', ring: '#6ee7b7' };
  if (score >= 60) return { grade: 'Moderate',   color: '#f59e0b', bg: '#fef3c7', ring: '#fcd34d' };
  if (score >= 40) return { grade: 'Developing', color: '#f97316', bg: '#ffedd5', ring: '#fdba74' };
  return             { grade: 'Low',         color: '#ef4444', bg: '#fee2e2', ring: '#fca5a5' };
}

const RULES = [
  {
    key: 'engagementScore', threshold: 60, priority: 'HIGH', icon: '💬',
    titleEn: 'Boost Your Engagement',
    titleSw: 'Ongeza Ushirikiano Wako',
    descEn:  'Create interactive content — ask questions, run polls, and reply to every comment. Higher engagement tells platform algorithms your content is relevant, increasing your organic reach significantly.',
    descSw:  'Tengeneza maudhui ya kuvutia — uliza maswali, fanya kura, na jibu kila maoni. Ushirikiano zaidi huambia algoriti kwamba maudhui yako yana umuhimu, na kuongeza kuonekana kwako bila malipo.',
  },
  {
    key: 'profileScore', threshold: 70, priority: 'HIGH', icon: '📋',
    titleEn: 'Complete Your Business Profile',
    titleSw: 'Kamilisha Wasifu Wako wa Biashara',
    descEn:  'Fill in all profile fields on every platform — operating hours, contact details, business category, and a clear description. A complete profile is the foundation of online discoverability and customer trust.',
    descSw:  'Jaza sehemu zote za wasifu katika kila jukwaa — masaa ya kazi, mawasiliano, aina ya biashara, na maelezo wazi. Wasifu kamili ndio msingi wa kuonekana mtandaoni na kujenga imani ya wateja.',
  },
  {
    key: 'responsivenessScore', threshold: 60, priority: 'HIGH', icon: '⚡',
    titleEn: 'Reply Faster to Customer Messages',
    titleSw: 'Jibu Ujumbe wa Wateja Haraka Zaidi',
    descEn:  'Aim to reply within one hour. Fast responses build trust and significantly increase conversion rates. Set up auto-replies for out-of-hours periods.',
    descSw:  'Jaribu kujibu ndani ya saa moja. Majibu ya haraka hujenga imani na huongeza sana uwezekano wa mauzo. Weka majibu ya otomatiki wakati wa nje ya masaa ya kazi.',
  },
  {
    key: 'postingScore', threshold: 50, priority: 'MEDIUM', icon: '📅',
    titleEn: 'Post More Consistently',
    titleSw: 'Tuma Machapisho kwa Utaratibu Zaidi',
    descEn:  'Increase to at least 3 posts per week. Consistent content keeps your business visible, relevant to your audience, and favoured by platform algorithms.',
    descSw:  'Ongeza hadi angalau machapisho 3 kwa wiki. Machapisho ya mara kwa mara husaidia biashara yako kuonekana, kukaa muhimu kwa wateja wako, na kupendwa na algoriti za jukwaa.',
  },
  {
    key: 'platformScore', threshold: 60, priority: 'MEDIUM', icon: '🌐',
    titleEn: 'Expand to More Platforms',
    titleSw: 'Panua Kwenye Majukwaa Zaidi',
    descEn:  'A Google Business Profile is free and makes your business findable on Google Search and Maps. Consider adding WhatsApp Business for direct customer messaging.',
    descSw:  'Wasifu wa Google Business ni bure na husaidia biashara yako kupatikana kwenye Google. Fikiria kuongeza WhatsApp Business ili kuwezesha ujumbe wa moja kwa moja na wateja.',
  },
];

function generateRecommendations(scores, language = 'en') {
  return RULES
    .filter(r => (scores[r.key] || 0) < r.threshold)
    .map(r => ({
      icon: r.icon, priority: r.priority,
      title: language === 'sw' ? r.titleSw : r.titleEn,
      desc:  language === 'sw' ? r.descSw  : r.descEn,
      titleEn: r.titleEn, titleSw: r.titleSw,
      descEn:  r.descEn,  descSw:  r.descSw,
    }));
}
