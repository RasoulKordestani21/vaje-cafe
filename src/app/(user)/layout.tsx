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
      <main className="flex-grow pt-20">{children}</main>
      <Footer />
    </>
  );
}
