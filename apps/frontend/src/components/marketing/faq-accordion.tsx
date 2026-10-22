'use client';

import { useState } from 'react';

function ChevronIcon() {
  return (
    <svg
      className="mkt-fq-ico"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function FaqList({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mkt-faq-list">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.q} className={`mkt-fq${open ? ' open' : ''}`}>
            <button
              type="button"
              className="mkt-fq-q"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : index)}
            >
              <span>{item.q}</span>
              <ChevronIcon />
            </button>
            <div className="mkt-fq-a" style={{ maxHeight: open ? 320 : 0 }}>
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
