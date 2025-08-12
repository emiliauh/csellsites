import "./globals.css";

export const metadata = {
  title: "Canada Cell Sites — Clean UI",
  description: "Sleek Canadian cell site map using OpenStreetMap overlays."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 antialiased">{children}</body>
    </html>
  );
}
