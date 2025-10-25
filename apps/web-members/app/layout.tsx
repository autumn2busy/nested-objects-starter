
export const metadata = {
  title: "Nested Objects Members",
  description: "AI-powered member hub for inspectors, notaries, and gig pros."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
