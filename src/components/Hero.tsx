import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section
      id="hero"
      className="bg-[#F5F5F4] text-[#1C1917] text-center flex flex-col items-center justify-center gap-8 min-h-[calc(100vh-160px)]"
    >
      <h1 className="text-6xl font-bold">Bienvenue sur MovieDNA</h1>
      <p className="text-2xl">Découvre ton profil cinématographique</p>
      <Button className="bg-[#3F4752] text-white px-8 py-3 rounded hover:opacity-90 transition">
        Commencer le Quiz
      </Button>
    </section>
  )
}