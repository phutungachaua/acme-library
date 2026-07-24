import Image from "next/image";

export default function BrandLogo({ className = "h-10 w-10", priority = false }) {
  return <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white ${className}`}>
    <Image src="/logo-acme.png" alt="Logo công ty ACME" width={800} height={800} priority={priority} className="h-full w-full scale-[1.18] object-contain" />
  </span>;
}
