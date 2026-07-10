import p1 from '../assets/p1_small.jpg'
import p2 from '../assets/p2_small.jpg'
import p3 from '../assets/p3_small.jpg'

interface TrustedByProps {
  isDarkMode: boolean;
  /** Defaults to the standard trust line; pass to align with landing variant tone. */
  trustLabel?: string;
  /** Optional override for the avatar stack badge (e.g. live user count). */
  countBadge?: string;
}

export function TrustedBy({ isDarkMode, trustLabel, countBadge }: TrustedByProps) {
  const avatars = [
    { src: p1, alt: 'Customer' },
    { src: p2, alt: 'Customer' },
    { src: p3, alt: 'Customer' },
  ];
  const label = trustLabel ?? 'Trusted by 104+ indie founders';
  const badge = countBadge ?? '100+';

  return (
    <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-x-3">
      <div className="flex -space-x-2 shrink-0">
        {avatars.map((avatar, index) => (
          <div
            key={index}
            className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900"
          >
            <img
              src={avatar.src}
              alt={avatar.alt}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        ))}
        <div className="inline-flex h-8 min-w-[2.25rem] items-center justify-center rounded-full bg-indigo-600 px-2 ring-2 ring-white dark:ring-gray-900">
          <span className="text-[11px] font-bold tabular-nums leading-none text-white">{badge}</span>
        </div>
      </div>
      <span className={`text-center text-sm font-medium leading-snug sm:text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {label}
      </span>
    </div>
  );
} 