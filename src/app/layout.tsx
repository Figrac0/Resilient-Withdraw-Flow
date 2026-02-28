import type { ReactNode } from "react";

export const metadata = {
    title: "Withdraw Flow",
    description: "Withdraw page test assignment",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
