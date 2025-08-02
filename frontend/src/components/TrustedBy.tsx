import p1 from '../assets/p1_small.jpg'
import p2 from '../assets/p2_small.jpg'
import p3 from '../assets/p3_small.jpg'

interface TrustedByProps {
  isDarkMode: boolean;
}

export function TrustedBy({ isDarkMode }: TrustedByProps) {
  const founders = [
    { src: p1, alt: 'Founder 1' },
    { src: p2, alt: 'Founder 2' },
    { src: p3, alt: 'Founder 3' },
  ];

  return (
    <div className="flex items-center justify-center gap-x-2">
      <div className="flex -space-x-2">
        {founders.map((founder, index) => (
          <div
            key={index}
            className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900"
          >
            <img
              src={founder.src}
              alt={founder.alt}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        ))}
        <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900 bg-indigo-600 flex items-center justify-center">
          <span className="text-xs font-medium text-white">18+</span>
        </div>
      </div>
      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Trusted by 104+ indie founders
      </span>
    </div>
  );
} 