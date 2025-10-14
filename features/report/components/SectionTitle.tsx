export default function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
      <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-neutral-900 uppercase mb-8 mt-14 px-2 border-l-4 border-coral pl-4 bg-gradient-to-r from-white via-indigo-50 to-white">
        {children}
      </h2>
    );
  }
  