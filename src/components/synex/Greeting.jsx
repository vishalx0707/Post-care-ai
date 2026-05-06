import { cn } from '@/lib/utils';

function timeOfDay(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'late evening';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

export function Greeting({ name, className }) {
  const tod = timeOfDay();
  const intro = tod === 'morning' ? 'Good morning'
    : tod === 'afternoon' ? 'Good afternoon'
    : tod === 'evening' ? 'Good evening'
    : 'Hello';
  return (
    <h1 className={cn('font-serif text-5xl md:text-6xl text-ink leading-[1.05] tracking-[-0.02em]', className)}>
      {intro}
      {name ? <>, <span className="italic">{name}</span></> : null}
      <span className="text-accent">.</span>
    </h1>
  );
}
