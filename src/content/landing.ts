// Copy follows SKILL.md: no hyphens in text, sentence case, no filler words.
// Figures marked SPEC come from FRONTEND_CONTEXT.md. Confirm them before launch.

export const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Track a parcel', href: '/track' },
];

export const stats = [
  { value: '45s', label: 'Average matching time' }, // SPEC
  { value: '99.98%', label: 'On time deliveries' }, // SPEC
  { value: '1.2M+', label: 'GPS pings processed per day' }, // SPEC
];

export const benefits = [
  {
    icon: 'target',
    title: 'Matching that scores every driver',
    body: 'Distance counts for 40%, vehicle capacity for 30% and shift status for 30%. Preview the ranked candidates, or override the pick with one click.',
  },
  {
    icon: 'lock',
    title: 'Recipient details stay locked',
    body: 'Drivers see only an approximate drop area until the parcel is collected. Name, phone and address unlock at pickup.',
  },
  {
    icon: 'password',
    title: 'Delivery confirmed by a four digit code',
    body: 'The recipient receives a code by email when the driver starts the route. A wrong parcel or a wrong door cannot be marked delivered.',
  },
  {
    icon: 'users',
    title: 'Extra capacity when you need it',
    body: 'Keep your own drivers first, then let jobs fall back to the platform driver pool after a set number of attempts.',
  },
] as const;

export const steps = [
  { title: 'Add shipments', body: 'Create one parcel, or import up to 5,000 rows from a CSV or Excel file.' },
  {
    title: 'Let the engine offer the job',
    body: 'The best scored driver gets an offer with a countdown. If they pass, the next candidate is tried.',
  },
  {
    title: 'Follow it to the door',
    body: 'Watch the driver on the live map. Recipients follow the same trip from a public tracking page.',
  },
];

export const tagline = [
  'Every parcel finds the right driver.',
  'Every driver knows the next stop.',
  'Every recipient knows when to open the door.',
].join(' ');

// No real testimonial supplied yet, so this stays a marked placeholder (SKILL B8).
export const testimonial = { quote: '{{testimonial}}', name: '{{customer name}}', role: '{{role and company}}' };

export const faqs = [
  {
    q: 'Do I need my own drivers?',
    a: 'No. Add your own team with a join code or an email invitation, and turn on the platform driver pool in dispatch settings if you want extra capacity.',
  },
  {
    q: 'How does LogiFlow choose a driver?',
    a: 'It scores each available driver on distance, vehicle capacity and shift status. Dispatchers can preview the ranked list and assign a different driver by hand.',
  },
  {
    q: 'When does the driver see the recipient address?',
    a: 'After pickup. Before that, the job sheet shows only an approximate drop area, so contact details are never exposed early.',
  },
  {
    q: 'How does the recipient confirm delivery?',
    a: 'When the driver starts the route, the recipient gets a four digit code by email. The driver enters it at the door to complete the delivery.',
  },
  {
    q: 'Can I create shipments in bulk?',
    a: 'Yes. Upload a CSV or Excel file with up to 5,000 rows and 10 MB. You get a row by row report for anything that failed validation.',
  },
  {
    q: 'Can I connect my own systems?',
    a: 'Create an API key with the scopes you need, such as shipments:read and shipments:write, and exchange it for a token from your warehouse software.',
  },
  {
    q: 'What can recipients see?',
    a: 'A public tracking page with the delivery status and, once the parcel is on the road, a live map and arrival estimate.',
  },
];
