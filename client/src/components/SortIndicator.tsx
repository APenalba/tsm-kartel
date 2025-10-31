export default function SortIndicator({ direction }: { direction: 'asc' | 'desc' }) {
  return (
    <svg
      className="ml-2 inline-block h-3 w-3 text-cyan-300"
      viewBox="0 0 12 12"
      aria-hidden="true"
    >
      {direction === 'asc' ? (
        <path d="M6 3l4 6H2l4-6z" fill="currentColor" />
      ) : (
        <path d="M6 9l4-6H2l4 6z" fill="currentColor" />
      )}
    </svg>
  );
}


