import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BugReportButton from "../components/bugs/BugReportButton";
import "@/app/globals.css";

export const metadata = {
  title: "VoloNexus.AI",
  description: "AI-driven Meeting Orchestration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="bg-mf-bg bg-none text-white antialiased min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        <AuthProvider>
          <Navbar />
          <BugReportButton />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
