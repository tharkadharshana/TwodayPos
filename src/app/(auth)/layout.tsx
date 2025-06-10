
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* 
        This div ensures that on very small screens, the auth card doesn't touch the edges.
        The container on login/register pages provides the max-width and styling for the card itself. 
      */}
      {children}
    </div>
  );
}
