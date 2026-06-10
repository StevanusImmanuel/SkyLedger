'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type FaqCategory = {
  title: string;
  description: string;
  items: FaqItem[];
};

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: 'Getting Started',
    description: 'Basic workflow for operators and public tracking users.',
    items: [
      {
        id: 'what-is-skyledger',
        question: 'What is SkyLedger?',
        answer: 'SkyLedger is an airport-operator cargo dashboard for managing Air Waybill shipments, monitoring route activity, and showing public tracking status with timestamps.',
      },
      {
        id: 'track-awb',
        question: 'How do I track an AWB?',
        answer: 'Open the tracking page, enter a valid AWB number such as JL-196784, then review the shipment status, route, timestamp timeline, and shipment metadata.',
      },
    ],
  },
  {
    title: 'Cargo Operations',
    description: 'How shipment lifecycle data is shown in the operator interface.',
    items: [
      {
        id: 'shipment-statuses',
        question: 'How do shipment statuses work?',
        answer: 'Shipment statuses summarize the current cargo state, such as pending, in transit, delayed, delivered, or cancelled. Delivery status gives a more operational checkpoint when available.',
      },
      {
        id: 'timestamps',
        question: 'How are timestamps generated?',
        answer: 'Tracking timestamps come from shipment events. If a shipment has no events yet, the tracking interface can still show the shipment creation time as the initial timestamp.',
      },
    ],
  },
  {
    title: 'Account Management',
    description: 'Profile and permission behavior for airport operators.',
    items: [
      {
        id: 'update-profile',
        question: 'How do I update my profile?',
        answer: 'The Settings page currently shows a read-only session profile. Admin-managed profile changes should be handled through Account Management when permitted.',
      },
      {
        id: 'permissions',
        question: 'How do permissions work?',
        answer: 'Admins can manage users and activity logs. Operators focus on shipment workflows. Viewers have limited access based on protected route rules.',
      },
    ],
  },
  {
    title: 'Security',
    description: 'Authentication, password, and session expectations.',
    items: [
      {
        id: 'password-policy',
        question: 'What are the password policies?',
        answer: 'Passwords must be at least 8 characters and include an uppercase letter and a number. This keeps demo accounts consistent with the validation rules.',
      },
      {
        id: 'session-management',
        question: 'How does session management work?',
        answer: 'SkyLedger uses a protected terminal session cookie. Protected app routes redirect unauthenticated users to the restricted login screen.',
      },
      {
        id: 'authentication-info',
        question: 'Where is authentication information displayed?',
        answer: 'The sidebar profile and Settings page read the active authenticated user session and display operator identity, role, email, and SkyLedger employee ID when available.',
      },
    ],
  },
  {
    title: 'System Usage',
    description: 'Reading operational pages during a demo or daily workflow.',
    items: [
      {
        id: 'dashboard',
        question: 'What does the Dashboard show?',
        answer: 'The Dashboard shows live cargo route visualization and top operational routes so operators can quickly understand route load and shipment activity.',
      },
      {
        id: 'logs',
        question: 'What do Activity Logs show?',
        answer: 'Activity Logs show important user and system actions such as login, shipment changes, user management events, and report actions for audit visibility.',
      },
      {
        id: 'reports',
        question: 'What does the Reports page show?',
        answer: 'Reports provide operational shipment summaries, filtering, and export actions for delivered or destination-side cargo analysis.',
      },
    ],
  },
];

function matchesQuery(category: FaqCategory, item: FaqItem, query: string) {
  if (!query) return true;
  const target = `${category.title} ${category.description} ${item.question} ${item.answer}`.toLowerCase();
  return target.includes(query);
}

export default function FaqPage() {
  const [query, setQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(['what-is-skyledger']));

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCategories = useMemo(
    () =>
      FAQ_CATEGORIES.map((category) => ({
        ...category,
        items: category.items.filter((item) => matchesQuery(category, item, normalizedQuery)),
      })).filter((category) => category.items.length > 0),
    [normalizedQuery]
  );

  const totalResults = filteredCategories.reduce((sum, category) => sum + category.items.length, 0);

  function toggleItem(id: string) {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div>
      <PageTitle title="FAQ" />

      <div className="sl-faq-header">
        <div>
          <div className="sl-settings-kicker">Help &amp; Support</div>
          <h1 className="sl-page-title" style={{ marginBottom: 0 }}>Frequently Asked Questions</h1>
          <p className="sl-page-subtitle" style={{ marginTop: 4 }}>
            Quick operator reference for tracking, cargo operations, security, and system pages.
          </p>
        </div>
        <div className="sl-faq-header-icon" aria-hidden="true">
          <HelpCircle size={24} strokeWidth={2.3} />
        </div>
      </div>

      <div className="sl-faq-search-card">
        <div className="sl-faq-search">
          <Search size={16} strokeWidth={2.2} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search FAQ topics..."
            aria-label="Search FAQ topics"
          />
        </div>
        <div className="sl-faq-result-count">
          {totalResults} {totalResults === 1 ? 'answer' : 'answers'}
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="sl-faq-empty">
          <div className="sl-faq-empty-icon">
            <Search size={24} strokeWidth={2.2} />
          </div>
          <h2>No FAQ results found</h2>
          <p>Try a broader search term such as tracking, status, password, or reports.</p>
        </div>
      ) : (
        <div className="sl-faq-grid">
          {filteredCategories.map((category) => (
            <section key={category.title} className="sl-faq-card">
              <div className="sl-faq-category-header">
                <div>
                  <h2>{category.title}</h2>
                  <p>{category.description}</p>
                </div>
              </div>

              <div className="sl-faq-list">
                {category.items.map((item) => {
                  const isOpen = openItems.has(item.id);

                  return (
                    <div key={item.id} className={`sl-faq-item ${isOpen ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="sl-faq-question"
                        onClick={() => toggleItem(item.id)}
                        aria-expanded={isOpen}
                      >
                        <span>{item.question}</span>
                        <ChevronDown size={16} strokeWidth={2.4} />
                      </button>
                      <div className="sl-faq-answer">
                        {item.answer}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
