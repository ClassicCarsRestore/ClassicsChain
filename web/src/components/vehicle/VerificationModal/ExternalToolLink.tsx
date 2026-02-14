import { ExternalLink } from 'lucide-react';

interface ExternalToolLinkProps {
  href: string;
  label: string;
  description: string;
  hint?: string;
}

export function ExternalToolLink({ href, label, description, hint }: ExternalToolLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex cursor-pointer items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          <ExternalLink className="h-4 w-4" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {description}
        </p>
        {hint && (
          <p className="text-xs text-muted-foreground/80 mt-1 italic">
            {hint}
          </p>
        )}
      </div>
    </a>
  );
}
