import { cn } from '@/lib/utils';
import { Eyebrow } from './Eyebrow';

export function Section({ eyebrow, title, lede, className, children, ...props }) {
  return (
    <section className={cn('w-full', className)} {...props}>
      {(eyebrow || title || lede) && (
        <header className="mb-8">
          {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
          {title && (
            <h2 className="font-serif text-4xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
              {title}
            </h2>
          )}
          {lede && <p className="mt-3 text-ink-3 text-lg max-w-[60ch]">{lede}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
