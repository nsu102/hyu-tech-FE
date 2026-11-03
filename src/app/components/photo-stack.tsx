/* eslint-disable @next/next/no-img-element */
export function PhotoStack({ className = "" }: { className?: string }) {
  return <div className={`photo-stack ${className}`} aria-hidden="true"><span><img src="/images/objects/book.png" alt="" width={120} height={90} draggable={false}/></span><span><img src="/images/objects/coffee.png" alt="" width={120} height={90} draggable={false}/></span></div>;
}
