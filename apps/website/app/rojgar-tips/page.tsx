import BlogsListPage from "@/components/blogs/BlogsListPage";
import { ROJGAR_TIPS_PATH } from "@/constants";

export const metadata = {
  title: "Rojgar Tips - Apna Rojgar India",
  description:
    "Job and work tips for workers, employers, and mediators on Apna Rojgar India.",
  alternates: {
    canonical: `https://www.apnarojgarindia.com${ROJGAR_TIPS_PATH}`,
  },
};

export default function RojgarTipsIndexPage() {
  return <BlogsListPage />;
}
