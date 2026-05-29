type LoadingStateProps = {
  message: string;
  className?: string;
};

export function LoadingState({ message, className = "" }: LoadingStateProps) {
  return (
    <div
      className={`text-center py-12 font-sans text-ink-400 ${className}`.trim()}
    >
      {message}
    </div>
  );
}
