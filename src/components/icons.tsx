import { Palette, type LucideProps } from "lucide-react"; // Changed Store to Palette

export const Icons = {
  Logo: (props: LucideProps) => (
    <Palette {...props} /> // Changed Store to Palette
  ),
};
