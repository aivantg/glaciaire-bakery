type EmptyStateProps = {
  message: string;
  className?: string;
};

export function EmptyState({ message, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`text-center py-12 font-sans text-ink-400 ${className}`.trim()}
    >
      {message}
    </div>
  );
}
