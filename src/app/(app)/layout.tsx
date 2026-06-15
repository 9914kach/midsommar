import { NavDrawer } from "@/components/NavDrawer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <NavDrawer>{children}</NavDrawer>;
}
