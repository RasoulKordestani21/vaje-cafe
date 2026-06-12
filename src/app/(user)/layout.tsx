import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function UserLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-grow pt-[5.25rem] sm:pt-24">{children}</main>
      <Footer />
    </>
  );
}
