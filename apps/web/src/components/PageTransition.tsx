'use client';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  // Disabling the GW transition overlay specifically due to Next.js strict mode & App Router overlap bugs
  return (
    <>
      {children}
    </>
  );
}
