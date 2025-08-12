import "./globals.css";

export const metadata = {
  title: "Canada Cell Sites",
  description: "Canadian cell site map (ISED) with vector tiles and liquid glass UI."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
