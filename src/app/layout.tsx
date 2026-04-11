import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Nav is removed from here so it doesn't overlap the Loader */}
        {children}
      </body>
    </html>
  );
}