/** The yellow/brown/green tricolour rule used on ECOWAS letterheads and publication covers. */
export function StripeBar({ className = "" }: { className?: string }) {
  return (
    <div className={`ecowas-stripe ${className}`}>
      <span />
      <span />
      <span />
    </div>
  );
}
