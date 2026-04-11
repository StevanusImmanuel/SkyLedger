import Nav from "@/components/nav";

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="pt-16">
        {children}
      </main>
    </>
  );
}