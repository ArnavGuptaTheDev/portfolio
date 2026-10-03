// All site copy lives here. Edit freely; components only read from this file.

export interface Link {
  label: string;
  href: string;
}

export interface CaseStudy {
  title: string;
  problem: string;
  built: string;
  outcome: string;
  tags: string[];
}

export interface Role {
  title: string;
  org: string;
  period: string;
  summary?: string;
  /** Short label shown on the pipeline node, e.g. "now" or "2019". */
  marker: string;
}

export interface Project {
  title: string;
  summary: string;
  details?: string;
  tags: string[];
  links?: Link[];
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export const site = {
  url: 'https://arnavgupta.pages.dev',
  title: 'Arnav Gupta · Backend & Data Engineer',
  description:
    'Arnav Gupta is a backend and data engineer who builds data-heavy backend systems: pipelines, system-to-system syncs and APIs.',
  ogImage: '/og.png',
};

export const person = {
  name: 'Arnav Gupta',
  nickname: 'Ashu',
  role: 'Backend & Data Engineer',
  tagline: 'I build data-heavy backend systems: pipelines, system-to-system syncs, and the APIs that sit on top of them.',
  location: 'Lakhimpur, UP, India',
  relocation: 'Open to relocating (Delhi NCR / Lucknow) and to remote roles.',
  email: 'clusterwithgigs@gmail.com',
  linkedin: 'https://www.linkedin.com/in/the-arnavgupta',
  github: 'https://github.com/ArnavGuptaTheDev',
  resume: '/resume.pdf',
  /** Filename the browser saves the resume as. */
  resumeFilename: 'Arnav_Gupta_Resume.pdf',
};

export const hero = {
  primary: { label: 'View work', href: '#work' },
  secondary: { label: 'Download resume', href: person.resume },
};

export const about = {
  heading: 'About',
  paragraphs: [
    'I’m a backend and data engineer based in Lakhimpur, UP, India. At OrionTCS I build the systems that move a US pharmacy chain’s data between its warehouse, its CRM and its partners, plus the internal tools its field teams use.',
    'Before that I spent more than five years freelancing, shipping 200+ projects in Node.js, Python and Java: bots, automation, auth and verification tools, dashboards and API integrations.',
    'I do my best work where the data is messy and being correct matters more than looking clever.',
  ],
  currently: 'Solving problems.',
};

export const work: CaseStudy[] = [
  {
    title: 'Warehouse → CRM sync engine',
    problem: 'Account data in the CRM kept drifting from the data warehouse, and simple one-way syncs created duplicate accounts.',
    built:
      'A sync engine that diffs live CRM state against an expected-state table on every run and queues create, update, reparent, archive and merge actions through an outbox. Destructive changes wait for a human to approve them.',
    outcome: 'Fuzzy matching on name, territory and ZIP recovered 5,000+ accounts that would otherwise have been duplicated.',
    tags: ['Zoho CRM', 'T-SQL', 'Outbox pattern', 'Fuzzy matching'],
  },
  {
    title: 'Incremental delta feed to a partner',
    problem: 'A partner platform needed transaction data every day, and full re-sends were slow and easy to get wrong.',
    built:
      'An incremental feed from Azure Data Factory to SFTP. Insert, update and sync timestamps drive change detection, and group-level replace semantics make every re-send idempotent.',
    outcome:
      'Traced phantom deletes to upstream payment IDs that change when claims are re-adjudicated, then redefined the record grain so changed claims stopped looking like deletes.',
    tags: ['Azure Data Factory', 'SFTP', 'Change detection', 'Idempotency'],
  },
  {
    title: 'Pharmacy field app',
    problem: 'Field reps needed warehouse data on their visits, but the warehouse lives on a private network.',
    built: 'A Node.js backend and React frontend on Azure App Service that reach the private data warehouse through VNet integration.',
    outcome: 'One internal app for pharmacy visits, with the warehouse still off the public internet.',
    tags: ['Node.js', 'React', 'Azure App Service', 'VNet'],
  },
  {
    title: 'Clinical adherence metrics',
    problem: 'Clinical and commercial teams needed a reliable answer to whether patients stay on their medication.',
    built:
      'PDC, MPR and persistency curves, plus a months-on-therapy year-over-year analysis using restricted mean survival time (RMST).',
    outcome: 'Adherence measured with standard, comparable metrics, split by drug, market basket and new versus refill patients.',
    tags: ['T-SQL', 'PDC / MPR', 'Survival analysis', 'Power BI'],
  },
  {
    title: 'Serverless reporting pipelines',
    problem: 'Internal and external reports were being assembled by hand, every cycle.',
    built: 'Scheduled pipelines on Azure Functions that pull, shape and deliver each report without anyone touching a spreadsheet.',
    outcome: 'Reports that used to be built by hand now arrive on schedule, the same way every time.',
    tags: ['Azure Functions', 'Scheduling', 'T-SQL'],
  },
];

export const experience: Role[] = [
  {
    title: 'Data Analyst',
    org: 'OrionTCS',
    period: 'Jun 2025 – present',
    summary:
      'Backend and data engineering for a US pharmacy chain: CRM sync, partner data feeds, an internal field app on Azure, clinical metrics and reporting automation.',
    marker: 'now',
  },
  {
    title: 'Freelance Full Stack Developer',
    org: 'Self-employed',
    period: 'Apr 2019 – Jan 2025',
    summary:
      '200+ client projects in Node.js, Python and Java: bots, automation, auth and verification tools, dashboards and API integrations.',
    marker: '2019',
  },
  {
    title: 'Master of Computer Applications (MCA)',
    org: 'Amity University',
    period: 'Expected 2027',
    marker: 'edu',
  },
  {
    title: 'Bachelor of Business Administration (BBA)',
    org: 'Jain University',
    period: '2025',
    marker: 'edu',
  },
];

// Add a project by adding an entry here; the Projects section renders whatever is in this list.
export const projects: Project[] = [
  {
    title: 'Personal Finance Manager',
    summary:
      'A private, invite-only app for tracking spending. It parses HDFC and ICICI bank statements in the browser, so the file is never uploaded, sorts each transaction into a category automatically, and tracks budgets, informal loans and EMIs.',
    details:
      'Google OAuth with PKCE, per-user isolation enforced by composite foreign keys, and an append-only audit log guarded by database triggers. Money is stored as whole paise. The security tests run against the real Worker and D1, and a new API route fails the build until it is added to the suite. It runs on Cloudflare’s free tier.',
    tags: ['TypeScript', 'Astro', 'Hono', 'Cloudflare Workers', 'D1', 'Zod', 'Vitest'],
    links: [{ label: 'Live site', href: 'https://pfm.arnavg.me/' }],
  },
  {
    title: 'Spotter',
    summary:
      'An invite-only, mobile-first gym app for two partners who coach each other. Each writes the other’s workout and diet plan, and both log their days, share progress photos, chat and keep a shared streak. It installs to the home screen and runs on Cloudflare’s free tier.',
    details:
      'Hand-written Google OAuth with PKCE, no auth library. One-to-one pairing is enforced by UNIQUE constraints and a SQL trigger, and invites are claimed atomically. Photos are stripped of location data before upload and served from a private bucket. 142 tests run in the real Workers runtime, including one that scans every table to confirm a deleted account leaves nothing behind.',
    tags: ['TypeScript', 'Astro', 'Preact', 'Cloudflare Workers', 'D1', 'R2', 'Vitest'],
    links: [
      { label: 'Live site', href: 'https://trainer.arnavg.me/' },
      { label: 'Code', href: 'https://github.com/ArnavGuptaTheDev/partner-gym-trainer' },
    ],
  },
  {
    title: 'EMICalc',
    summary:
      'An offline EMI calculator for Indian loans and credit-card EMIs that shows the real cost: 18% GST on interest, processing fees and first-statement interest, combined into one effective annual rate (IRR).',
    details:
      'The calculation code is a pure TypeScript module with Vitest tests, and the IRR is found by bisection so it always returns an answer. It includes a prepayment planner, a hand-written SVG chart, share links and CSV, PNG and PDF exports. No backend and no UI framework.',
    tags: ['Astro', 'TypeScript', 'Vitest', 'SVG', 'PWA', 'Cloudflare Pages'],
    links: [{ label: 'Live site', href: 'https://emicalc.arnavg.me/' }],
  },
  {
    title: 'GiftLink',
    summary:
      'Send someone a virtual bouquet and ice cream as a link. The whole gift is encoded in the URL fragment, so there is no server, no database and no accounts, and gift contents never reach server logs.',
    details:
      'Default fields are left out, so a basic gift fits in 44 characters. Custom theme colours keep their hue but are adjusted to meet contrast minimums. Older link formats still decode after format changes, and links fall back through three keyless shorteners.',
    tags: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion'],
    links: [{ label: 'Live site', href: 'https://asmallgift.arnavg.me/' }],
  },
  {
    title: 'Home Lab',
    summary:
      'A self-hosted Proxmox server running LXC containers and VMs: NAS, media server, Home Assistant, Docker services and a CUPS print server.',
    details: 'Set up GPU passthrough to a VM and recovered the data from a failing disk.',
    tags: ['Proxmox', 'LXC', 'Docker', 'Linux'],
  },
];

export const skills: SkillGroup[] = [
  { label: 'Languages & runtimes', items: ['Node.js', 'TypeScript', 'Python', 'SQL / T-SQL'] },
  { label: 'Data', items: ['SQL Server', 'MySQL', 'MongoDB', 'Power BI'] },
  { label: 'Cloud & infrastructure', items: ['Azure App Service', 'Azure Functions', 'Azure Data Factory', 'Docker', 'Linux'] },
  { label: 'Frontend', items: ['React'] },
];

export const contact = {
  heading: 'Get in touch',
  body: 'I’m open to backend and data engineering roles. Email is the fastest way to reach me.',
  links: [
    { label: 'Email', href: `mailto:${person.email}`, text: person.email },
    { label: 'LinkedIn', href: person.linkedin, text: 'in/the-arnavgupta' },
    { label: 'GitHub', href: person.github, text: 'ArnavGuptaTheDev' },
    { label: 'Resume', href: person.resume, text: 'Download resume' },
  ],
};

export const nav: Link[] = [
  { label: 'Work', href: '#work' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];
