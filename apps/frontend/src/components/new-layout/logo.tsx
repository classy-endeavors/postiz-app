'use client';

export const BrandMark = ({ size = 60 }: { size?: number }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
    >
      <rect width="30" height="30" rx="9" fill="#FF5227" />
      <g transform="translate(5 5) scale(0.833333)">
        <path
          d="M4 5h11L9 12h11L7 21l2.5-6.5H4.5Z"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
};

export const Logo = () => {
  return (
    <div className="mt-[8px] min-w-[60px] min-h-[60px] flex items-center justify-center">
      <BrandMark size={48} />
    </div>
  );
};
