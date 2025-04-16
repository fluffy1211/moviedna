export default function Hero() {
  return (
    <section
      id="hero"
      className="bg-[#F5F5F4] text-[#1C1917] text-center flex flex-col items-center justify-center gap-6 min-h-[calc(100vh-160px)]"
    >
      <h1 className="text-4xl font-bold">Bienvenue sur MovieDNA</h1>
      <p className="text-lg">Découvre ton profil cinématographique</p>
      <button className="bg-[#3F4752] text-white px-6 py-2 rounded hover:opacity-90 transition">
        Commencer le Quiz
      </button>
    </section>
  )
}
