import "./globals.css";

export const metadata = {
  title: "Canada Cell Sites",
  description: "Sleek Canadian cell site map with liquid glass UI."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 antialiased">{children}</body>
    </html>
  );
}
