import { metadata } from './layout.metadata';
import RootLayout from './layout';

export { metadata };

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RootLayout>{children}</RootLayout>
      </body>
    </html>
  );
}