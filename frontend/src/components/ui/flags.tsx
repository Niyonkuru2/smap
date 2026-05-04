import React from 'react';

interface FlagProps {
  className?: string;
}

// United Kingdom Flag
export const UKFlag: React.FC<FlagProps> = ({ className = "w-6 h-4" }) => (
  <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <clipPath id="uk-clip">
      <rect x="0" y="0" width="60" height="30" rx="2" />
    </clipPath>
    <g clipPath="url(#uk-clip)">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#uk-center)" />
      <clipPath id="uk-center">
        <path d="M30,0 L60,0 L60,15 L30,15 L30,0 M0,15 L30,15 L30,30 L0,30 L0,15" />
      </clipPath>
      <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
);

// Rwanda Flag
export const RwandaFlag: React.FC<FlagProps> = ({ className = "w-6 h-4" }) => (
  <svg className={className} viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="40" rx="2" fill="#20603D" />
    <rect y="0" width="60" height="20" fill="#00A1DE" />
    <rect y="20" width="60" height="10" fill="#FAD201" />
    <rect y="30" width="60" height="10" fill="#20603D" />
    {/* Sun symbol */}
    <g transform="translate(45, 10)">
      <circle cx="0" cy="0" r="6" fill="#FAD201" />
      {[...Array(24)].map((_, i) => (
        <line
          key={i}
          x1="0"
          y1="-7"
          x2="0"
          y2="-9"
          stroke="#FAD201"
          strokeWidth="1"
          transform={`rotate(${i * 15})`}
        />
      ))}
    </g>
  </svg>
);

// France Flag
export const FranceFlag: React.FC<FlagProps> = ({ className = "w-6 h-4" }) => (
  <svg className={className} viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="40" rx="2" fill="#fff" />
    <rect x="0" y="0" width="20" height="40" fill="#002395" />
    <rect x="40" y="0" width="20" height="40" fill="#ED2939" />
  </svg>
);

// Wrapper component for all flags
export const Flag: React.FC<{ country: 'uk' | 'rw' | 'fr'; className?: string }> = ({ 
  country, 
  className = "w-6 h-4" 
}) => {
  switch (country) {
    case 'uk':
      return <UKFlag className={className} />;
    case 'rw':
      return <RwandaFlag className={className} />;
    case 'fr':
      return <FranceFlag className={className} />;
    default:
      return null;
  }
};
