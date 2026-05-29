type ErrorStateProps = {
  message: string;
  className?: string;
};

export function ErrorState({ message, className = "" }: ErrorStateProps) {
  return (
    <div className={`text-center py-12 text-red-500 ${className}`.trim()}>
      {message}
    </div>
  );
}
