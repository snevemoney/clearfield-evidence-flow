export function QueryError({ message }: { message?: string }) {
  return (
    <div className="border border-destructive/30 bg-destructive/5 rounded-sm p-3 my-2" role="alert">
      <p className="font-mono text-xs text-destructive">
        {message || "Failed to load data."}
      </p>
    </div>
  );
}
