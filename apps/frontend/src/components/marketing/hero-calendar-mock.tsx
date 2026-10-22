const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type PostTone = 'published' | 'scheduled' | 'draft';

type CellPost = {
  time: string;
  title: string;
  tone: PostTone;
  platform: 'yt' | 'tt' | 'ig' | 'li';
};

type Cell = {
  day: number | null;
  today?: boolean;
  posts?: CellPost[];
};

const CELLS: Cell[] = [
  { day: null },
  { day: null },
  { day: 1 },
  { day: 2 },
  {
    day: 3,
    posts: [{ time: '9:00 AM', title: 'Weekly hook', tone: 'published', platform: 'ig' }],
  },
  { day: 4 },
  { day: 5 },
  {
    day: 6,
    posts: [{ time: '11:00 AM', title: 'Shorts batch', tone: 'published', platform: 'yt' }],
  },
  { day: 7 },
  { day: 8 },
  {
    day: 9,
    posts: [{ time: '2:30 PM', title: 'Product tip', tone: 'scheduled', platform: 'li' }],
  },
  { day: 10 },
  { day: 11 },
  {
    day: 12,
    posts: [{ time: '8:00 AM', title: 'TikTok cut', tone: 'scheduled', platform: 'tt' }],
  },
  { day: 13 },
  { day: 14 },
  {
    day: 15,
    today: true,
    posts: [
      { time: '10:00 AM', title: 'Launch post', tone: 'scheduled', platform: 'ig' },
      { time: '4:00 PM', title: 'Behind scenes', tone: 'draft', platform: 'yt' },
    ],
  },
  { day: 16 },
  {
    day: 17,
    posts: [{ time: '1:00 PM', title: 'Carousel', tone: 'draft', platform: 'ig' }],
  },
  { day: 18 },
  { day: 19 },
  {
    day: 20,
    posts: [{ time: '7:30 AM', title: 'Trend reply', tone: 'scheduled', platform: 'tt' }],
  },
  { day: 21 },
  { day: 22 },
  { day: 23 },
  {
    day: 24,
    posts: [{ time: '12:00 PM', title: 'Case study', tone: 'draft', platform: 'li' }],
  },
  { day: 25 },
  { day: 26 },
  { day: 27 },
  { day: 28 },
  { day: 29 },
  { day: 30 },
  { day: 31 },
  { day: null },
  { day: null },
];

function PlatformDot({ platform }: { platform: CellPost['platform'] }) {
  const label =
    platform === 'yt'
      ? 'YT'
      : platform === 'tt'
        ? 'TT'
        : platform === 'ig'
          ? 'IG'
          : 'in';
  return <span className={`mkt-mock-plat mkt-mock-plat-${platform}`}>{label}</span>;
}

export function HeroCalendarMock() {
  return (
    <div className="mkt-mock" aria-hidden="true">
      <div className="mkt-mock-chrome">
        <span />
        <span />
        <span />
      </div>

      <div className="mkt-mock-shell">
        <aside className="mkt-mock-rail">
          <div className="mkt-mock-mark" />
          <div className="mkt-mock-rail-item active" />
          <div className="mkt-mock-rail-item" />
          <div className="mkt-mock-rail-item" />
          <div className="mkt-mock-rail-item" />
        </aside>

        <div className="mkt-mock-main">
          <div className="mkt-mock-top">
            <div>
              <div className="mkt-mock-title">Calendar</div>
              <div className="mkt-mock-subtitle">October 2026</div>
            </div>
            <div className="mkt-mock-top-actions">
              <span className="mkt-mock-pill">Today</span>
              <span className="mkt-mock-seg">
                <i>Day</i>
                <i>Week</i>
                <i className="on">Month</i>
              </span>
              <span className="mkt-mock-cta">+ New post</span>
            </div>
          </div>

          <div className="mkt-mock-banner">
            <div>
              <strong>$135</strong>
              <span>Saved with Zyntra</span>
            </div>
            <div>
              <strong>4h 30m</strong>
              <span>Time saved this week</span>
            </div>
            <div>
              <strong>15 posts</strong>
              <span>Across 4 channels</span>
            </div>
          </div>

          <div className="mkt-mock-cal">
            <div className="mkt-mock-dow">
              {DAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="mkt-mock-grid">
              {CELLS.map((cell, idx) => (
                <div
                  key={idx}
                  className={`mkt-mock-cell${cell.today ? ' today' : ''}${
                    cell.day === null ? ' empty' : ''
                  }`}
                >
                  {cell.day !== null ? (
                    <>
                      <div className="mkt-mock-daynum">{cell.day}</div>
                      {cell.posts?.map((post) => (
                        <div
                          key={`${post.time}-${post.title}`}
                          className={`mkt-mock-post ${post.tone}`}
                        >
                          <PlatformDot platform={post.platform} />
                          <div className="mkt-mock-post-text">
                            <em>{post.time}</em>
                            <strong>{post.title}</strong>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
