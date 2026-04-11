import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-100">
        {/* Nav is removed from here so it doesn't stay stuck on the screen during loading */}
        {children}
      </body>
    </html>
  );
}